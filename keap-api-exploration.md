# Keap API Exploration

## Objetivo
Identificar endpoints úteis da API do Keap para integrar dados de CRM/email marketing no dashboard de analytics da 31-Day Wisdom Challenge.

## Categorias de Endpoints Disponíveis

### 1. **Contact** (Contatos/Leads)
- `GET /v1/contacts` - Lista todos os contatos com filtros
- `GET /v1/contacts/{contactId}` - Detalhes de um contato específico
- `GET /v1/contacts/{contactId}/tags` - Tags aplicadas ao contato
- `GET /v1/contacts/{contactId}/emails` - Histórico de emails enviados
- Útil para: Comparar leads do Keap com leads do Supabase, verificar tags aplicadas

### 2. **Email** (Campanhas de Email)
- `GET /v1/emails` - Lista emails enviados
- `GET /v1/emails/{emailId}` - Detalhes de um email específico
- Útil para: Tracking de email engagement (opens, clicks, bounces)

### 3. **Campaign** (Sequências/Automações)
- `GET /v1/campaigns` - Lista todas as campanhas
- `GET /v1/campaigns/{campaignId}` - Detalhes de uma campanha
- Útil para: Ver quais contatos estão em quais sequências de email

### 4. **E-Commerce** (Pedidos/Transações)
- `GET /v1/orders` - Lista todos os pedidos
- `GET /v1/orders/{orderId}` - Detalhes de um pedido
- `GET /v1/transactions` - Lista transações
- Útil para: Comparar vendas VIP do Keap com dados do Supabase

### 5. **Tags** (Segmentação)
- `GET /v1/tags` - Lista todas as tags disponíveis
- `GET /v1/tags/{tagId}/contacts` - Contatos com uma tag específica
- Útil para: Segmentar leads por comportamento (ex: "VIP Purchased", "Attended Day 1")

### 6. **Opportunity** (Pipeline de Vendas)
- `GET /v1/opportunities` - Lista oportunidades de venda
- Útil para: Tracking de high-ticket sales pipeline

### 7. **Appointment** (Agendamentos)
- `GET /v1/appointments` - Lista agendamentos
- Útil para: Tracking de call bookings para high-ticket offers

### 8. **Affiliate** (Afiliados)
- `GET /v1/affiliates` - Lista afiliados
- `GET /v1/affiliates/commissions` - Comissões de afiliados
- Útil para: Se houver programa de afiliados na campanha

## Endpoints Mais Relevantes para o Dashboard

### Prioridade ALTA 🔴
1. **GET /v1/contacts** - Para comparar leads Keap vs Supabase
2. **GET /v1/orders** - Para validar vendas VIP e revenue
3. **GET /v1/tags** + **GET /v1/tags/{tagId}/contacts** - Para segmentação por comportamento

### Prioridade MÉDIA 🟡
4. **GET /v1/emails** - Para email engagement metrics
5. **GET /v1/campaigns** - Para ver performance de sequências
6. **GET /v1/opportunities** - Para high-ticket sales pipeline

### Prioridade BAIXA 🟢
7. **GET /v1/appointments** - Para call bookings
8. **GET /v1/affiliates** - Se houver programa de afiliados

## Próximos Passos

1. ✅ Explorar documentação completa da API
2. ⏳ Testar autenticação OAuth com credenciais do projeto
3. ⏳ Fazer chamadas de teste para endpoints prioritários
4. ⏳ Criar tRPC procedures para integrar dados do Keap
5. ⏳ Adicionar métricas do Keap ao dashboard (ex: "Email Open Rate", "Tag Distribution")

## Notas Técnicas

- **Autenticação**: OAuth 2.0 (credenciais já configuradas: KEAP_CLIENT_ID, KEAP_CLIENT_SECRET, KEAP_APP_ID)
- **Rate Limits**: Verificar documentação para limites de requisições
- **Paginação**: Usar `limit` e `offset` para grandes volumes de dados
- **Filtros**: Maioria dos endpoints suporta filtros por data (`since`, `until`)
