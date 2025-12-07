# Keap API - Análise Completa para Dashboard

## 📋 Resumo Executivo

A API do Keap oferece endpoints robustos para integrar dados de CRM, email marketing e e-commerce ao dashboard. Os dados mais relevantes para o projeto são:

1. **Contatos** (leads/contacts) - para comparar com Supabase
2. **Pedidos** (orders) - para validar vendas VIP
3. **Tags** - para segmentação comportamental
4. **Emails** - para métricas de engajamento

---

## 🎯 Endpoints Prioritários

### 1. **GET /v1/contacts** - Lista de Contatos
**Prioridade: 🔴 ALTA**

**Descrição**: Retorna todos os contatos do Keap com filtros avançados

**Query Parameters**:
- `email` - Filtrar por email específico
- `given_name` - Filtrar por primeiro nome
- `family_name` - Filtrar por sobrenome
- `since` - Data de início (ex: 2017-01-01T22:17:59.039Z)
- `until` - Data de fim
- `limit` - Quantidade de resultados (paginação)
- `offset` - Offset para paginação
- `order` - Ordenar por: id, date_created, last_updated, name, email
- `order_direction` - ASCENDING ou DESCENDING

**Response**:
```json
{
  "contacts": [
    {
      "id": 123,
      "given_name": "John",
      "family_name": "Doe",
      "email_addresses": [
        {
          "email": "john@example.com",
          "field": "EMAIL1"
        }
      ],
      "phone_numbers": [
        {
          "number": "+1234567890",
          "field": "PHONE1"
        }
      ],
      "date_created": "2025-12-01T10:00:00.000Z",
      "last_updated": "2025-12-06T15:30:00.000Z",
      "tag_ids": [45, 67, 89],
      "custom_fields": [
        {
          "id": 10,
          "content": "VIP"
        }
      ]
    }
  ],
  "count": 150,
  "next": "https://api.infusionsoft.com/crm/rest/v1/contacts?offset=50",
  "previous": null
}
```

**Casos de Uso**:
- Comparar leads do Keap com leads do Supabase (validação de dados)
- Identificar leads que não estão no Supabase
- Verificar tags aplicadas aos contatos (ex: "VIP Purchased", "Wisdom Challenge")

---

### 2. **GET /v1/orders** - Lista de Pedidos
**Prioridade: 🔴 ALTA**

**Descrição**: Retorna todos os pedidos/transações do Keap

**Query Parameters**:
- `contact_id` - Filtrar por ID do contato
- `product_id` - Filtrar por ID do produto
- `since` - Data de início
- `until` - Data de fim
- `paid` - Filtrar por status de pagamento (boolean)
- `order` - Ordenar por: order_date, update_date
- `limit` / `offset` - Paginação

**Valores de order_status**: `DRAFT`, `SENT`, `VIEWED`, `PAID`

**Response**:
```json
{
  "orders": [
    {
      "id": 456,
      "contact_id": 123,
      "order_date": "2025-12-05T14:20:00.000Z",
      "order_title": "VIP Upgrade",
      "order_type": "Online",
      "status": "PAID",
      "total": 31.00,
      "total_paid": 31.00,
      "order_items": [
        {
          "id": 789,
          "product_id": 10,
          "product_name": "31-Day Wisdom Challenge VIP",
          "quantity": 1,
          "price": 31.00
        }
      ]
    }
  ],
  "count": 45,
  "next": null,
  "previous": null
}
```

**Casos de Uso**:
- Validar vendas VIP (order_total >= $31)
- Comparar revenue do Keap com Supabase
- Identificar pedidos sem contact_id (problema de atribuição)
- Tracking de produtos vendidos (VIP, Kingdom Seeker Trials)

---

### 3. **GET /v1/tags** - Lista de Tags
**Prioridade: 🟡 MÉDIA**

**Descrição**: Retorna todas as tags disponíveis no Keap

**Response**:
```json
{
  "tags": [
    {
      "id": 45,
      "name": "VIP Purchased",
      "description": "Customer purchased VIP upgrade",
      "category": {
        "id": 5,
        "name": "Sales"
      }
    },
    {
      "id": 67,
      "name": "Wisdom Challenge - Day 1 Attended",
      "description": "Attended first day of challenge"
    }
  ]
}
```

**Casos de Uso**:
- Mapear tags para segmentação
- Identificar contatos por comportamento (ex: "Attended Day 5", "Opened Email")

---

### 4. **GET /v1/tags/{tagId}/contacts** - Contatos com Tag Específica
**Prioridade: 🟡 MÉDIA**

**Descrição**: Retorna todos os contatos que possuem uma tag específica

**Query Parameters**:
- `limit` / `offset` - Paginação

**Response**:
```json
{
  "contacts": [
    {
      "id": 123,
      "given_name": "John",
      "family_name": "Doe",
      "email": "john@example.com"
    }
  ],
  "count": 25
}
```

**Casos de Uso**:
- Contar quantos leads têm tag "VIP Purchased"
- Segmentar leads por comportamento (ex: "Email Clicked", "Attended Day 10")

---

### 5. **GET /v1/contacts/{contactId}/emails** - Histórico de Emails
**Prioridade: 🟡 MÉDIA**

**Descrição**: Retorna todos os emails enviados para um contato específico

**Query Parameters**:
- `contact_id` - ID do contato
- `since` / `until` - Filtro de data
- `email_sent_type` - Tipo de email (ex: "Broadcast", "Sequence")

**Response**:
```json
{
  "emails": [
    {
      "id": 999,
      "subject": "Day 1 - Welcome to Wisdom Challenge",
      "sent_date": "2025-12-01T08:00:00.000Z",
      "opened_date": "2025-12-01T09:15:00.000Z",
      "clicked_date": "2025-12-01T09:20:00.000Z",
      "status": "opened"
    }
  ]
}
```

**Casos de Uso**:
- Email engagement metrics (open rate, click rate)
- Tracking de sequências de email
- Identificar leads engajados vs não-engajados

---

### 6. **GET /v1/campaigns** - Lista de Campanhas/Sequências
**Prioridade: 🟡 MÉDIA**

**Descrição**: Retorna todas as campanhas de email (sequências automatizadas)

**Response**:
```json
{
  "campaigns": [
    {
      "id": 50,
      "name": "Wisdom Challenge - Pre-Launch Sequence",
      "created_date": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

**Casos de Uso**:
- Ver quais sequências de email estão ativas
- Tracking de performance de campanhas

---

### 7. **GET /v1/opportunities** - Pipeline de Vendas
**Prioridade: 🟢 BAIXA**

**Descrição**: Retorna oportunidades de venda (deals) no pipeline

**Query Parameters**:
- `contact_id` - Filtrar por contato
- `stage_id` - Filtrar por estágio do pipeline
- `since` / `until` - Filtro de data

**Response**:
```json
{
  "opportunities": [
    {
      "id": 777,
      "contact_id": 123,
      "opportunity_title": "High-Ticket Coaching Program",
      "stage": {
        "id": 10,
        "name": "Proposal Sent"
      },
      "projected_revenue": 5000.00,
      "date_created": "2025-12-05T10:00:00.000Z"
    }
  ]
}
```

**Casos de Uso**:
- Tracking de high-ticket sales pipeline
- Identificar leads em diferentes estágios de venda

---

## 🔐 Autenticação

**Método**: OAuth 2.0

**Credenciais Disponíveis**:
- `KEAP_CLIENT_ID` - Client ID da aplicação
- `KEAP_CLIENT_SECRET` - Client Secret
- `KEAP_APP_ID` - ID da conta Keap

**Fluxo de Autenticação**:
1. Obter access token via OAuth 2.0
2. Incluir token no header: `Authorization: Bearer {access_token}`
3. Tokens expiram após algumas horas (refresh token necessário)

**Base URL**: `https://api.infusionsoft.com/crm/rest`

**Documentação Completa**: https://developer.infusionsoft.com/docs/rest/

---

## 📊 Métricas Úteis para o Dashboard

### Métricas Primárias (Comparação Keap vs Supabase)
1. **Total de Leads** - Comparar `GET /v1/contacts` com tabela `contacts`
2. **Total de VIP Sales** - Comparar `GET /v1/orders` (total >= $31) com tabela `orders`
3. **Total Revenue** - Somar `order.total` de todos os pedidos PAID

### Métricas de Engajamento (Email)
4. **Email Open Rate** - Calcular a partir de `GET /v1/contacts/{id}/emails`
5. **Email Click Rate** - Calcular clicks / opens
6. **Broadcast Subscribers** - Contar contatos com tag específica

### Métricas de Segmentação (Tags)
7. **Leads por Tag** - Ex: "VIP Purchased", "Day 10 Attended"
8. **Tag Distribution** - Distribuição de leads por comportamento

### Métricas de Pipeline (High-Ticket)
9. **Opportunities Created** - Total de oportunidades criadas
10. **Pipeline Value** - Soma de `projected_revenue` de todas as opportunities

---

## 🚀 Próximos Passos

### Fase 1: Autenticação e Teste ✅
- [x] Explorar documentação da API
- [ ] Implementar OAuth 2.0 flow
- [ ] Testar chamadas básicas (GET /v1/contacts, GET /v1/orders)

### Fase 2: Integração Backend
- [ ] Criar helper functions em `server/keap.ts` para chamadas à API
- [ ] Implementar refresh token logic
- [ ] Criar tRPC procedures para endpoints prioritários:
  - `keap.contacts.list`
  - `keap.orders.list`
  - `keap.tags.list`

### Fase 3: Dashboard UI
- [ ] Adicionar nova página "Keap Comparison" ao dashboard
- [ ] Criar cards de comparação: Keap Leads vs Supabase Leads
- [ ] Criar cards de comparação: Keap Revenue vs Supabase Revenue
- [ ] Adicionar tabela de discrepâncias (leads missing, revenue mismatch)

### Fase 4: Métricas Avançadas
- [ ] Implementar email engagement tracking
- [ ] Adicionar tag distribution chart
- [ ] Criar high-ticket pipeline visualization

---

## ⚠️ Considerações Importantes

### Rate Limits
- Keap API tem rate limits (verificar documentação atualizada)
- Implementar caching para evitar chamadas excessivas
- Usar paginação adequadamente (limit/offset)

### Data Sync
- Dados do Keap podem estar mais atualizados que Supabase
- Implementar sync periódico (ex: a cada 15 minutos)
- Considerar webhooks do Keap para updates em tempo real

### Mapeamento de Dados
- `contact_id` do Keap pode não corresponder ao `id` do Supabase
- Usar `email` como chave de matching entre sistemas
- Documentar campos customizados usados no Keap

### Performance
- Evitar buscar todos os contatos de uma vez (usar paginação)
- Cachear tags e produtos (mudam raramente)
- Implementar queries incrementais (since/until)

---

## 📝 Notas Técnicas

### Formato de Datas
- Todas as datas em ISO 8601: `2017-01-01T22:17:59.039Z`
- Timezone: UTC
- Converter para BRT no frontend

### Paginação
- Usar `limit` (default: 50, max: 1000)
- Usar `offset` para páginas seguintes
- Response inclui `next` e `previous` URLs

### Filtros Comuns
- `since` - Data de início (LastUpdated)
- `until` - Data de fim
- `order` - Campo para ordenação
- `order_direction` - ASCENDING ou DESCENDING

---

## 🔗 Links Úteis

- **Documentação Oficial**: https://developer.infusionsoft.com/docs/rest/
- **OAuth Guide**: https://developer.infusionsoft.com/docs/authorization/
- **API Status**: https://status.keap.com/
- **Community Forum**: https://community.keap.com/
