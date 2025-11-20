# Data Mapping: Attendance Tracking

Este documento detalha como os dados de YouTube e Zoom são mapeados para a tabela `daily_attendance` no Supabase.

## 📊 Schema da Tabela `daily_attendance`

```sql
CREATE TABLE IF NOT EXISTS daily_attendance (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  day_number INTEGER NOT NULL,
  free_attendance INTEGER DEFAULT 0,
  vip_attendance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por data
CREATE INDEX idx_daily_attendance_date ON daily_attendance(date);

-- Index para busca por dia do challenge
CREATE INDEX idx_daily_attendance_day_number ON daily_attendance(day_number);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_attendance_updated_at 
    BEFORE UPDATE ON daily_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 🔄 Fluxo de Dados

### 1. YouTube → `free_attendance`

**Fonte:** Manus Data API → `Youtube/get_channel_videos`

**Mapeamento:**

| Campo YouTube API | Tipo | Campo Supabase | Transformação |
|-------------------|------|----------------|---------------|
| `video.stats.views` | string | `free_attendance` | `parseInt(views, 10)` |
| `video.publishedTimeText` | string | `date` | Calcular data baseado em `day_number` |
| N/A (calculado) | number | `day_number` | Dias desde `CHALLENGE_START_DATE` |

**Exemplo de Resposta da API:**

```json
{
  "contents": [
    {
      "type": "video",
      "video": {
        "videoId": "abc123",
        "title": "31DWC - Day 1: Introduction",
        "publishedTimeText": "2 days ago",
        "stats": {
          "views": "1250"
        }
      }
    }
  ]
}
```

**Transformação:**

```javascript
const viewCount = parseInt(video.stats?.views || '0', 10);
// viewCount = 1250

const date = '2026-01-01'; // Calculado baseado em day_number
const dayNumber = 1;

// Inserir no Supabase
{
  "date": "2026-01-01",
  "day_number": 1,
  "free_attendance": 1250,
  "vip_attendance": 0  // Será preenchido pelo Zoom
}
```

### 2. Zoom → `vip_attendance`

**Fonte:** Zoom API → `/v2/report/meetings/{meetingId}/participants`

**Mapeamento:**

| Campo Zoom API | Tipo | Campo Supabase | Transformação |
|----------------|------|----------------|---------------|
| `participants[]` | array | `vip_attendance` | Count unique by `user_id` or `user_email` |
| N/A (calculado) | number | `day_number` | Dias desde `CHALLENGE_START_DATE` |
| N/A (hoje) | date | `date` | `new Date().toISOString().split('T')[0]` |

**Exemplo de Resposta da API:**

```json
{
  "page_count": 1,
  "page_size": 300,
  "total_records": 85,
  "participants": [
    {
      "id": "user1@example.com",
      "user_id": "16778240",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "join_time": "2026-01-01T10:00:00Z",
      "leave_time": "2026-01-01T11:30:00Z",
      "duration": 90
    },
    {
      "id": "user2@example.com",
      "user_id": "16778241",
      "user_name": "Jane Smith",
      "user_email": "jane@example.com",
      "join_time": "2026-01-01T10:05:00Z",
      "leave_time": "2026-01-01T11:25:00Z",
      "duration": 80
    }
    // ... mais participantes
  ]
}
```

**Transformação (Remover Duplicatas):**

```javascript
const participants = response.participants || [];
const uniqueParticipants = new Set();

participants.forEach(participant => {
  // Usar user_id como identificador único (fallback para email)
  const identifier = participant.user_id || participant.user_email;
  
  if (identifier) {
    uniqueParticipants.add(identifier);
  }
});

const vipAttendance = uniqueParticipants.size;
// vipAttendance = 85

// Atualizar no Supabase (PATCH)
{
  "vip_attendance": 85
}
```

## 🔀 Estratégia de Upsert

### Workflow YouTube (Primeiro a Rodar - 23:59)

**Operação:** `POST` com `Prefer: resolution=merge-duplicates`

```http
POST /rest/v1/daily_attendance
Prefer: resolution=merge-duplicates

{
  "date": "2026-01-01",
  "day_number": 1,
  "free_attendance": 1250,
  "vip_attendance": 0
}
```

**Comportamento:**
- Se registro não existe → **INSERT** novo registro
- Se registro existe (mesmo `date`) → **UPDATE** `free_attendance`

### Workflow Zoom (Segundo a Rodar - 23:00)

**Operação:** `PATCH` com filtro por data

```http
PATCH /rest/v1/daily_attendance?date=eq.2026-01-01

{
  "vip_attendance": 85
}
```

**Comportamento:**
- Atualiza apenas a coluna `vip_attendance` do registro existente
- Se registro não existe → Fallback para `POST` (criar novo)

## 📈 Exemplo de Evolução dos Dados

### Dia 1 - Janeiro 1, 2026

**23:00 - Zoom Workflow roda primeiro (excepcionalmente)**

```sql
-- Registro criado
INSERT INTO daily_attendance (date, day_number, free_attendance, vip_attendance)
VALUES ('2026-01-01', 1, 0, 85);
```

**23:59 - YouTube Workflow roda**

```sql
-- Registro atualizado (merge)
UPDATE daily_attendance 
SET free_attendance = 1250
WHERE date = '2026-01-01';
```

**Resultado Final:**

| date       | day_number | free_attendance | vip_attendance |
|------------|------------|-----------------|----------------|
| 2026-01-01 | 1          | 1250            | 85             |

### Dia 2 - Janeiro 2, 2026

**23:00 - Zoom Workflow**

```sql
-- Tenta UPDATE, mas registro não existe ainda
-- Fallback: INSERT
INSERT INTO daily_attendance (date, day_number, free_attendance, vip_attendance)
VALUES ('2026-01-02', 2, 0, 72);
```

**23:59 - YouTube Workflow**

```sql
-- Registro atualizado (merge)
UPDATE daily_attendance 
SET free_attendance = 980
WHERE date = '2026-01-02';
```

**Resultado Final:**

| date       | day_number | free_attendance | vip_attendance |
|------------|------------|-----------------|----------------|
| 2026-01-01 | 1          | 1250            | 85             |
| 2026-01-02 | 2          | 980             | 72             |

## 🔍 Queries Úteis

### Ver Attendance de Hoje

```sql
SELECT 
  date,
  day_number,
  free_attendance,
  vip_attendance,
  (free_attendance + vip_attendance) as total_attendance
FROM daily_attendance
WHERE date = CURRENT_DATE;
```

### Ver Evolução Completa do Challenge

```sql
SELECT 
  date,
  day_number,
  free_attendance,
  vip_attendance,
  ROUND((vip_attendance::numeric / NULLIF(free_attendance, 0)) * 100, 2) as vip_conversion_rate
FROM daily_attendance
WHERE day_number BETWEEN 1 AND 31
ORDER BY day_number ASC;
```

### Identificar Dias com Dados Faltando

```sql
SELECT 
  day_number,
  date,
  CASE 
    WHEN free_attendance = 0 THEN 'Missing YouTube data'
    WHEN vip_attendance = 0 THEN 'Missing Zoom data'
    ELSE 'Complete'
  END as status
FROM daily_attendance
WHERE day_number BETWEEN 1 AND 31
ORDER BY day_number ASC;
```

### Calcular Médias

```sql
SELECT 
  AVG(free_attendance) as avg_free_attendance,
  AVG(vip_attendance) as avg_vip_attendance,
  AVG((vip_attendance::numeric / NULLIF(free_attendance, 0)) * 100) as avg_conversion_rate
FROM daily_attendance
WHERE day_number BETWEEN 1 AND 31;
```

## ⚠️ Casos Especiais

### Caso 1: Vídeo Publicado Tarde

Se o vídeo do dia for publicado após 23:59:

**Solução:** O workflow do dia seguinte não encontrará o vídeo. Você pode:
1. Rodar o workflow manualmente ajustando `day_number`
2. Ou atualizar manualmente no Supabase:

```sql
UPDATE daily_attendance
SET free_attendance = 1250
WHERE date = '2026-01-01';
```

### Caso 2: Reunião Cancelada

Se a reunião VIP for cancelada:

**Solução:** O Zoom API retornará erro "Meeting does not exist". O workflow deve:
1. Capturar o erro
2. Inserir `vip_attendance = 0` (nenhum participante)

### Caso 3: Múltiplas Reuniões no Mesmo Dia

Se houver 2+ reuniões VIP no mesmo dia:

**Solução:** Modificar Node 6 do Zoom workflow para:

```javascript
const meetingIds = ['123456789', '987654321']; // Array de IDs
const allParticipants = new Set();

for (const meetingId of meetingIds) {
  const response = await fetchMeetingParticipants(meetingId);
  response.participants.forEach(p => {
    const id = p.user_id || p.user_email;
    if (id) allParticipants.add(id);
  });
}

const vipAttendance = allParticipants.size;
```

## 📊 Dashboard Integration

Os dados da tabela `daily_attendance` são consumidos pela página **Engagement & Sales** do dashboard:

### Query no Backend (server/supabase.ts)

```typescript
export async function getEngagementMetrics(startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_attendance')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  
  return data;
}
```

### Visualização no Frontend

```tsx
const chartData = attendanceData?.map(day => ({
  date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  free: day.free_attendance,
  vip: day.vip_attendance,
})) || [];
```

## ✅ Checklist de Validação

Após configurar ambos workflows, verificar:

- [ ] Tabela `daily_attendance` existe no Supabase
- [ ] Indexes criados corretamente
- [ ] Trigger `update_updated_at` funcionando
- [ ] Workflow YouTube insere `free_attendance` corretamente
- [ ] Workflow Zoom atualiza `vip_attendance` corretamente
- [ ] Constraint UNIQUE em `date` impede duplicatas
- [ ] Dashboard exibe dados corretamente
- [ ] Queries de análise retornam resultados esperados
