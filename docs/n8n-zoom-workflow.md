# N8N Workflow: Zoom API → Daily Attendance (VIP)

Este guia mostra como configurar um workflow no n8n para coletar dados de participantes do Zoom e popular a coluna `vip_attendance` na tabela `daily_attendance` no Supabase.

## 📋 Pré-requisitos

1. **Conta Zoom** com acesso ao Zoom Marketplace
2. **Zoom Server-to-Server OAuth App** criada no Zoom Marketplace
3. **Credenciais do Supabase** (URL + Key já configuradas)
4. **Meetings recorrentes** configurados no Zoom para os 31 dias do challenge

## 🎯 Objetivo

Coletar diariamente o número de participantes únicos das reuniões VIP do Zoom e atualizar a tabela `daily_attendance` com:
- `vip_attendance`: Número de participantes únicos da reunião do dia

## 🔑 Configuração Inicial: Zoom OAuth App

### Passo 1: Criar Server-to-Server OAuth App

1. Acesse [Zoom Marketplace](https://marketplace.zoom.us/)
2. Clique em **Develop** → **Build App**
3. Escolha **Server-to-Server OAuth**
4. Preencha:
   - **App Name:** 31DWC Attendance Tracker
   - **Short Description:** Track daily VIP attendance for 31-Day Wisdom Challenge
   - **Company Name:** Seu nome/empresa
5. Clique em **Create**

### Passo 2: Configurar Scopes

Na aba **Scopes**, adicione as seguintes permissões:

- ✅ `meeting:read:admin` - View and manage all user meetings
- ✅ `dashboard_meetings:read:admin` - View meeting dashboard data
- ✅ `report:read:admin` - View all user reports

Clique em **Continue** e depois **Activate** your app.

### Passo 3: Obter Credenciais

Na aba **App Credentials**, copie:
- **Account ID**
- **Client ID**
- **Client Secret**

Você precisará dessas credenciais no n8n.

## 🔧 Estrutura do Workflow

### Node 1: Schedule Trigger
**Tipo:** Schedule Trigger  
**Configuração:**
- **Trigger Interval:** Every day at 11:00 PM (23:00)
- **Timezone:** America/Sao_Paulo

**Por quê 23:00?** Para dar tempo da reunião do dia terminar (assumindo que as reuniões VIP acontecem durante o dia).

### Node 2: Set Challenge Config
**Tipo:** Code (JavaScript)  
**Propósito:** Configurar datas e IDs das reuniões

```javascript
// Data de início do 31-Day Wisdom Challenge
const CHALLENGE_START_DATE = new Date('2026-01-01');

// IDs das reuniões recorrentes do Zoom (um para cada dia ou uma recorrente)
// OPÇÃO 1: Se você criou uma reunião recorrente (31 ocorrências)
const RECURRING_MEETING_ID = '123456789'; // ID da reunião recorrente

// OPÇÃO 2: Se você criou 31 reuniões separadas (mapear dia → meeting ID)
const MEETING_IDS_BY_DAY = {
  1: '111111111',
  2: '222222222',
  3: '333333333',
  // ... até dia 31
};

// Data de hoje
const today = new Date();
today.setHours(0, 0, 0, 0);

// Calcular dia do challenge
const diffTime = today - CHALLENGE_START_DATE;
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

// Verificar se está dentro do período
if (diffDays < 1 || diffDays > 31) {
  return {
    json: {
      skip: true,
      message: `Fora do período do challenge. Dia: ${diffDays}`
    }
  };
}

// Escolher meeting ID baseado na opção configurada
const meetingId = RECURRING_MEETING_ID || MEETING_IDS_BY_DAY[diffDays];

if (!meetingId) {
  return {
    json: {
      skip: true,
      error: true,
      message: `Meeting ID não configurado para o dia ${diffDays}`
    }
  };
}

return {
  json: {
    skip: false,
    day_number: diffDays,
    date: today.toISOString().split('T')[0],
    meeting_id: meetingId,
    challenge_start: CHALLENGE_START_DATE.toISOString().split('T')[0]
  }
};
```

### Node 3: IF - Check if Within Challenge Period
**Tipo:** IF  
**Configuração:**
- **Condition:** `{{ $json.skip }}` equals `false`
- **True branch:** Continue
- **False branch:** Stop

### Node 4: Get Zoom OAuth Token
**Tipo:** HTTP Request  
**Propósito:** Obter access token do Zoom

**Configuração:**
- **Method:** POST
- **URL:** `https://zoom.us/oauth/token`
- **Authentication:** Basic Auth
  - **User:** `{{ $env.ZOOM_CLIENT_ID }}`
  - **Password:** `{{ $env.ZOOM_CLIENT_SECRET }}`
- **Query Parameters:**
  - `grant_type`: `account_credentials`
  - `account_id`: `{{ $env.ZOOM_ACCOUNT_ID }}`
- **Headers:**
  - `Content-Type`: `application/x-www-form-urlencoded`

**Variáveis de Ambiente no n8n:**
Adicione estas variáveis nas configurações do n8n:
- `ZOOM_ACCOUNT_ID`: Seu Account ID do Zoom
- `ZOOM_CLIENT_ID`: Seu Client ID
- `ZOOM_CLIENT_SECRET`: Seu Client Secret

### Node 5: Get Meeting Participants
**Tipo:** HTTP Request  
**Propósito:** Buscar lista de participantes da reunião

**Configuração:**
- **Method:** GET
- **URL:** `https://api.zoom.us/v2/report/meetings/{{ $node["Set Challenge Config"].json.meeting_id }}/participants`
- **Authentication:** None (usar header manual)
- **Headers:**
  - `Authorization`: `Bearer {{ $node["Get Zoom OAuth Token"].json.access_token }}`
  - `Content-Type`: `application/json`
- **Query Parameters:**
  - `page_size`: `300` (máximo permitido)

**Nota:** Se você tem mais de 300 participantes, precisará implementar paginação.

### Node 6: Count Unique Participants
**Tipo:** Code (JavaScript)  
**Propósito:** Contar participantes únicos (remover duplicatas)

```javascript
const participants = $json.participants || [];

// Usar Set para remover duplicatas baseado no email ou user_id
const uniqueParticipants = new Set();

participants.forEach(participant => {
  // Priorizar user_id, fallback para email
  const identifier = participant.user_id || participant.user_email || participant.name;
  
  if (identifier) {
    uniqueParticipants.add(identifier);
  }
});

const vipAttendance = uniqueParticipants.size;

return {
  json: {
    date: $node["Set Challenge Config"].json.date,
    day_number: $node["Set Challenge Config"].json.day_number,
    vip_attendance: vipAttendance,
    total_participants_raw: participants.length,
    meeting_id: $node["Set Challenge Config"].json.meeting_id
  }
};
```

### Node 7: Update Supabase
**Tipo:** HTTP Request  
**Propósito:** Atualizar apenas a coluna `vip_attendance`

**Configuração:**
- **Method:** PATCH
- **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/daily_attendance?date=eq.{{ $json.date }}`
- **Authentication:** None (usar header manual)
- **Headers:**
  - `apikey`: `{{ $env.SUPABASE_KEY }}`
  - `Authorization`: `Bearer {{ $env.SUPABASE_KEY }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=representation`
- **Body (JSON):**
```json
{
  "vip_attendance": {{ $json.vip_attendance }}
}
```

**Nota:** Usamos PATCH + filtro `?date=eq.{{ $json.date }}` para atualizar apenas o registro do dia específico.

### Node 8: IF - Check if Update Successful
**Tipo:** IF  
**Configuração:**
- **Condition:** `{{ $json.length }}` greater than `0`
- **True branch:** Log success
- **False branch:** Create new record (fallback)

### Node 9a: Log Success (True Branch)
**Tipo:** Code (JavaScript)

```javascript
console.log('✅ VIP attendance updated:', {
  date: $node["Count Unique Participants"].json.date,
  day_number: $node["Count Unique Participants"].json.day_number,
  vip_attendance: $node["Count Unique Participants"].json.vip_attendance
});

return { json: $json };
```

### Node 9b: Create New Record (False Branch - Fallback)
**Tipo:** HTTP Request  
**Propósito:** Se o registro não existir, criar um novo

**Configuração:**
- **Method:** POST
- **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/daily_attendance`
- **Headers:**
  - `apikey`: `{{ $env.SUPABASE_KEY }}`
  - `Authorization`: `Bearer {{ $env.SUPABASE_KEY }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=representation`
- **Body (JSON):**
```json
{
  "date": "{{ $node["Count Unique Participants"].json.date }}",
  "day_number": {{ $node["Count Unique Participants"].json.day_number }},
  "free_attendance": 0,
  "vip_attendance": {{ $node["Count Unique Participants"].json.vip_attendance }}
}
```

## 🔄 Fluxo Completo

```
Schedule (23:00 daily)
  ↓
Set Challenge Config
  ↓
IF (dentro do período?)
  ↓ (yes)
Get Zoom OAuth Token
  ↓
Get Meeting Participants
  ↓
Count Unique Participants
  ↓
Update Supabase (PATCH)
  ↓
IF (update successful?)
  ↓ (yes)          ↓ (no)
Log Success    Create New Record
```

## 🧪 Testando o Workflow

### 1. Teste de Autenticação

Primeiro, teste se as credenciais do Zoom estão corretas:

```bash
# Testar OAuth token
curl -X POST "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=YOUR_ACCOUNT_ID" \
  -u "CLIENT_ID:CLIENT_SECRET"
```

Deve retornar:
```json
{
  "access_token": "eyJh...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 2. Teste Manual no n8n

1. Clique em "Execute Workflow"
2. Ajuste a data no Node 2 para um dia que já teve reunião
3. Verifique se os participantes foram contados corretamente
4. Confirme no Supabase:

```sql
SELECT * FROM daily_attendance 
WHERE date = CURRENT_DATE;
```

## ⚠️ Troubleshooting

### Erro: "Meeting does not exist"
- **Causa:** Meeting ID incorreto ou reunião não aconteceu ainda
- **Solução:** Verificar ID da reunião no Zoom Dashboard

### Erro: "Invalid access token"
- **Causa:** Token expirou ou credenciais incorretas
- **Solução:** Verificar Account ID, Client ID e Client Secret

### VIP Attendance = 0
- **Causa:** Reunião não teve participantes ou ainda não aconteceu
- **Solução:** Normal se a reunião ainda não ocorreu

### Erro: "Insufficient privileges"
- **Causa:** Scopes não configurados corretamente
- **Solução:** Adicionar scopes `meeting:read:admin` e `report:read:admin`

### Duplicatas não removidas
- **Causa:** Participantes sem user_id ou email
- **Solução:** Ajustar lógica no Node 6 para usar `name` como fallback

## 📊 Dados Esperados

Após ambos workflows (YouTube + Zoom) rodarem:

| date       | day_number | free_attendance | vip_attendance |
|------------|------------|-----------------|----------------|
| 2026-01-01 | 1          | 1250            | 85             |
| 2026-01-02 | 2          | 980             | 72             |
| 2026-01-03 | 3          | 1100            | 90             |

## 🎯 Melhorias Futuras

1. **Paginação:** Implementar loop para buscar mais de 300 participantes
2. **Retry Logic:** Adicionar retry automático em caso de falha
3. **Alertas:** Notificar se attendance cair > 20% dia-a-dia
4. **Histórico:** Salvar lista de participantes em tabela separada para análise

## 🔗 Recursos

- [Zoom API Documentation](https://developers.zoom.us/docs/api/)
- [Zoom OAuth Guide](https://developers.zoom.us/docs/integrations/oauth/)
- [Meeting Reports API](https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/reportMeetingParticipants)

## ✅ Checklist de Configuração

- [ ] Criar Zoom Server-to-Server OAuth App
- [ ] Adicionar scopes necessários
- [ ] Copiar Account ID, Client ID, Client Secret
- [ ] Adicionar variáveis de ambiente no n8n
- [ ] Criar/configurar reuniões recorrentes no Zoom
- [ ] Mapear Meeting IDs no Node 2
- [ ] Testar autenticação OAuth
- [ ] Testar workflow completo
- [ ] Verificar dados no Supabase
- [ ] Ativar schedule para rodar diariamente
