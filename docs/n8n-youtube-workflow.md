# N8N Workflow: YouTube Analytics → Daily Attendance

Este guia mostra como configurar um workflow no n8n para coletar dados de visualizações do YouTube e popular a tabela `daily_attendance` no Supabase.

## 📋 Pré-requisitos

1. **Conta n8n** com acesso ao seu workspace
2. **Credenciais do Supabase** (URL + Key já configuradas nas variáveis de ambiente)
3. **YouTube Channel ID** do canal onde os vídeos do 31-Day Wisdom Challenge serão publicados
4. **Manus Data API** (já disponível no ambiente)

## 🎯 Objetivo

Coletar diariamente o número de visualizações dos vídeos do YouTube (Free attendance) e inserir na tabela `daily_attendance` com:
- `date`: Data do dia
- `day_number`: Dia do challenge (1-31)
- `free_attendance`: Número de views do vídeo do dia
- `vip_attendance`: 0 (será preenchido pelo workflow do Zoom)

## 🔧 Estrutura do Workflow

### Node 1: Schedule Trigger
**Tipo:** Schedule Trigger  
**Configuração:**
- **Trigger Interval:** Every day at 11:59 PM (23:59)
- **Timezone:** America/Sao_Paulo

**Por quê 23:59?** Para capturar as visualizações acumuladas do dia inteiro antes da meia-noite.

### Node 2: Set Challenge Start Date
**Tipo:** Code (JavaScript)  
**Propósito:** Calcular qual dia do challenge estamos e a data correspondente

```javascript
// Data de início do 31-Day Wisdom Challenge (ajuste conforme necessário)
const CHALLENGE_START_DATE = new Date('2026-01-01'); // Janeiro 1, 2026

// Data de hoje
const today = new Date();
today.setHours(0, 0, 0, 0);

// Calcular dia do challenge (1-31)
const diffTime = today - CHALLENGE_START_DATE;
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

// Só processar se estiver dentro do período do challenge (dias 1-31)
if (diffDays < 1 || diffDays > 31) {
  return {
    json: {
      skip: true,
      message: `Fora do período do challenge. Dia calculado: ${diffDays}`
    }
  };
}

return {
  json: {
    skip: false,
    day_number: diffDays,
    date: today.toISOString().split('T')[0], // YYYY-MM-DD
    challenge_start: CHALLENGE_START_DATE.toISOString().split('T')[0]
  }
};
```

### Node 3: IF - Check if Within Challenge Period
**Tipo:** IF  
**Configuração:**
- **Condition:** `{{ $json.skip }}` equals `false`
- **True branch:** Continue para buscar dados do YouTube
- **False branch:** Stop workflow

### Node 4: Get YouTube Channel Videos
**Tipo:** HTTP Request  
**Propósito:** Buscar lista de vídeos do canal usando Manus Data API

**Configuração:**
- **Method:** POST
- **URL:** `https://api.manus.im/data_api/v1/Youtube/get_channel_videos`
- **Authentication:** Bearer Token
  - **Token:** `{{ $env.VITE_FRONTEND_FORGE_API_KEY }}`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "query": {
    "id": "SEU_CHANNEL_ID_AQUI",
    "filter": "videos_latest",
    "hl": "en",
    "gl": "US"
  }
}
```

**Substituir:**
- `SEU_CHANNEL_ID_AQUI` → ID do canal do YouTube (ex: `UCQgFQdqiFQ_LfFBGP6z9dqQ`)

### Node 5: Find Today's Video
**Tipo:** Code (JavaScript)  
**Propósito:** Encontrar o vídeo correspondente ao dia do challenge

```javascript
const dayNumber = $node["Set Challenge Start Date"].json.day_number;
const videos = $json.contents || [];

// Procurar vídeo que contenha "Day X" ou "Dia X" no título
const todayVideo = videos.find(item => {
  if (item.type !== 'video') return false;
  
  const title = item.video?.title || '';
  
  // Padrões de busca: "Day 1", "Dia 1", "Day 01", etc.
  const patterns = [
    `Day ${dayNumber}`,
    `Dia ${dayNumber}`,
    `Day ${String(dayNumber).padStart(2, '0')}`,
    `Dia ${String(dayNumber).padStart(2, '0')}`
  ];
  
  return patterns.some(pattern => title.includes(pattern));
});

if (!todayVideo) {
  return {
    json: {
      error: true,
      message: `Vídeo do Day ${dayNumber} não encontrado`,
      day_number: dayNumber
    }
  };
}

const video = todayVideo.video;
const viewCount = parseInt(video.stats?.views || '0', 10);

return {
  json: {
    error: false,
    day_number: dayNumber,
    date: $node["Set Challenge Start Date"].json.date,
    video_id: video.videoId,
    video_title: video.title,
    free_attendance: viewCount,
    published_at: video.publishedTimeText
  }
};
```

### Node 6: IF - Check if Video Found
**Tipo:** IF  
**Configuração:**
- **Condition:** `{{ $json.error }}` equals `false`
- **True branch:** Continue para inserir no Supabase
- **False branch:** Send error notification (opcional)

### Node 7: Upsert to Supabase
**Tipo:** HTTP Request  
**Propósito:** Inserir ou atualizar registro na tabela `daily_attendance`

**Configuração:**
- **Method:** POST
- **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/daily_attendance`
- **Authentication:** None (usar header manual)
- **Headers:**
  - `apikey`: `{{ $env.SUPABASE_KEY }}`
  - `Authorization`: `Bearer {{ $env.SUPABASE_KEY }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `resolution=merge-duplicates`
- **Body (JSON):**
```json
{
  "date": "{{ $json.date }}",
  "day_number": {{ $json.day_number }},
  "free_attendance": {{ $json.free_attendance }},
  "vip_attendance": 0
}
```

**Nota:** O header `Prefer: resolution=merge-duplicates` faz com que o Supabase atualize o registro se já existir (baseado na constraint UNIQUE na coluna `date`).

### Node 8: Log Success (Opcional)
**Tipo:** Code (JavaScript)  
**Propósito:** Log para debug

```javascript
console.log('✅ YouTube attendance updated:', {
  date: $json.date,
  day_number: $json.day_number,
  free_attendance: $json.free_attendance,
  video_title: $node["Find Today's Video"].json.video_title
});

return { json: $json };
```

## 🔄 Fluxo Completo

```
Schedule (23:59 daily)
  ↓
Set Challenge Start Date
  ↓
IF (dentro do período 1-31?)
  ↓ (yes)
Get YouTube Channel Videos (Manus API)
  ↓
Find Today's Video (buscar "Day X")
  ↓
IF (vídeo encontrado?)
  ↓ (yes)
Upsert to Supabase
  ↓
Log Success
```

## 🧪 Testando o Workflow

1. **Teste Manual:**
   - Clique em "Execute Workflow" no n8n
   - Ajuste a data no Node 2 para simular um dia específico do challenge
   - Verifique se o vídeo correto foi encontrado
   - Confirme que o registro foi inserido no Supabase

2. **Verificar no Supabase:**
```sql
SELECT * FROM daily_attendance 
WHERE date = CURRENT_DATE 
ORDER BY day_number DESC;
```

## ⚠️ Troubleshooting

### Vídeo não encontrado
- **Causa:** Título do vídeo não segue o padrão "Day X"
- **Solução:** Ajustar os padrões de busca no Node 5

### Views = 0
- **Causa:** Vídeo foi publicado mas ainda não tem visualizações
- **Solução:** Normal, aguardar algumas horas

### Erro de autenticação Supabase
- **Causa:** `SUPABASE_KEY` incorreta ou expirada
- **Solução:** Verificar variáveis de ambiente no n8n

### Erro "column does not exist"
- **Causa:** Tabela `daily_attendance` não foi criada
- **Solução:** Criar tabela no Supabase:
```sql
CREATE TABLE IF NOT EXISTS daily_attendance (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  day_number INTEGER NOT NULL,
  free_attendance INTEGER DEFAULT 0,
  vip_attendance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📊 Dados Esperados

Após o workflow rodar por alguns dias, você verá:

| date       | day_number | free_attendance | vip_attendance |
|------------|------------|-----------------|----------------|
| 2026-01-01 | 1          | 1250            | 0              |
| 2026-01-02 | 2          | 980             | 0              |
| 2026-01-03 | 3          | 1100            | 0              |

**Nota:** `vip_attendance` será preenchido pelo workflow do Zoom (próximo guia).

## 🎯 Próximos Passos

1. ✅ Configurar este workflow de YouTube
2. ⏭️ Configurar workflow do Zoom API (veja `n8n-zoom-workflow.md`)
3. ⏭️ Configurar workflows de Meta Ads e Google Ads
4. ⏭️ Testar dashboard com dados reais
