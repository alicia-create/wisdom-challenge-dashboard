# Keap Tags Mapping - 31-Day Wisdom Challenge

## 📊 Visão Geral

Este documento mapeia todas as tags do Keap relacionadas ao evento 31-Day Wisdom Challenge e ao sistema List Defender de qualidade de leads.

---

## 🎯 Wisdom Challenge Tags (16 tags)

### Categoria: Lead Status & Opt-ins
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14705 | Historical - 31DWC - 2601 - Optin | Lead que fez opt-in histórico | Total Leads |
| 14703 | Trigger - 31DWC - 2601 - Optin | Trigger de novo opt-in | Real-time tracking |
| 14739 | Status - 31DWC - 2601 - NTN General Opt In | Opt-in geral para NTN (Next Thing Now) | Segmentação |
| 14741 | Status - 31DWC - 2601 - NTN VIP Opt In | Opt-in VIP para NTN | VIP tracking |

### Categoria: VIP Buyers
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14753 | Historical - 31DWC - 2601 - VIP Buyer | Histórico de compra VIP | VIP Sales count |
| 14749 | Trigger - 31DWC - 2601 - VIP Buyer | Trigger de nova compra VIP | Real-time VIP tracking |

### Categoria: Email Preferences
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14827 | Email - 31DWC - 2601 - Reminder Optin | Opt-in para emails de reminder | Broadcast subscribers |
| 14829 | Email - 31DWC - 2601 - Reminder Optout | Opt-out de reminders | Churn tracking |
| 14831 | Email - 31DWC - 2601 - Replay Optin | Opt-in para replays | Engagement tracking |
| 14833 | Email - 31DWC - 2601 - Replay Optout | Opt-out de replays | Churn tracking |
| 14835 | Email - 31DWC - 2601 - Promo Optin | Opt-in para promos | Marketing list |
| 14837 | Email - 31DWC - 2601 - Promo Optout | Opt-out de promos | Unsubscribe tracking |

### Categoria: Engagement
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14859 | Status - 31DWC - 2601 - Clicked NTN In Email | Clicou em email NTN | Email click rate |

### Categoria: Reminders
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14735 | Trigger - 31DWC - 2601 - General Reminders | Trigger de reminders gerais | Automation tracking |
| 14737 | Trigger - 31DWC - 2601 - VIP Reminders | Trigger de reminders VIP | VIP automation |

### Categoria: Additional Products
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14813 | Historical - 31DWC - 2601 - Journal Buyer | Comprador de journal | Upsell tracking |
| 14857 | Historical - Kingdom Seekers - 2601 - Trial | Trial do Kingdom Seekers | Kingdom Seeker Trials metric |

---

## 🛡️ List Defender Tags (26 tags)

### Categoria: Contact Status
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14811 | ListDefender: Contact = Is New Contact | Contato novo | New leads tracking |
| 14809 | ListDefender: Contact = Is Disqualified New Contact | Contato novo desqualificado | Quality filter |

### Categoria: Engagement Level
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14799 | ListDefender: Engagement Check = High Engagement | Alto engajamento | Quality score |
| 14801 | ListDefender: Engagement Check = Low Engagement | Baixo engajamento | Re-engagement needed |
| 14805 | ListDefender: Engagement Check = Never Engaged | Nunca engajou | Cold leads |
| 14807 | ListDefender: Engagement Check = Slipping | Engajamento caindo | Churn risk |
| 14803 | ListDefender: Engagement Check = Never Sent | Nunca recebeu email | New contacts |

### Categoria: Traffic Light Status
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14789 | ListDefender: Status = Green (Send Responsibly) | ✅ Seguro enviar | High quality leads |
| 14793 | ListDefender: Status = Yellow (Re-Engage) | ⚠️ Precisa re-engajar | Medium quality |
| 14791 | ListDefender: Status = Red (Do Not Send) | 🔴 NÃO enviar | Low quality / risky |

### Categoria: Quality Checks (Email Issues)
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14775 | ListDefender: Quality Check = Is Free | Email gratuito (Gmail, Yahoo) | Quality indicator |
| 14777 | ListDefender: Quality Check = Is Role | Email de função (info@, admin@) | Quality filter |
| 14779 | ListDefender: Quality Check = Is Typo | Typo no email | Data quality |
| 14781 | ListDefender: Quality Check = Is Vulgar | Email vulgar | Quality filter |
| 14783 | ListDefender: Quality Check = Is Disposable | Email descartável (temp mail) | 🚨 High risk |
| 14785 | ListDefender: Quality Check = Is Catchall Domain | Domínio catch-all | Medium risk |
| 14787 | ListDefender: Quality Check = Is Suspicious | Email suspeito | 🚨 High risk |
| 14773 | ListDefender: Quality Check = Is Tag | Email com tag (+) | Normal |

### Categoria: Validity Checks (Technical Issues)
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14761 | ListDefender: Valid Check = Invalid Structure | Estrutura inválida | 🚨 Remove |
| 14763 | ListDefender: Valid Check = Missing DNS | DNS não encontrado | 🚨 Remove |
| 14765 | ListDefender: Valid Check = Missing MX | MX record ausente | 🚨 Remove |
| 14767 | ListDefender: Valid Check = Invalid MX | MX record inválido | 🚨 Remove |
| 14769 | ListDefender: Valid Check = Not Found | Mailbox não existe | 🚨 Remove |
| 14771 | ListDefender: Valid Check = Mailbox Full | Caixa de entrada cheia | ⚠️ Retry later |

### Categoria: Triggers
| Tag ID | Nome | Descrição | Uso no Dashboard |
|--------|------|-----------|------------------|
| 14797 | ListDefender: Trigger = New Contact Scanned | Novo contato escaneado | Automation |
| 14795 | ListDefender: Trigger = Contact Scanned | Contato re-escaneado | Automation |

---

## 📈 Métricas para o Dashboard

### 1. Email Engagement Metrics
```typescript
// Open Rate = (Emails Opened / Emails Sent) * 100
// Click Rate = (Emails Clicked / Emails Sent) * 100
// Broadcast Subscribers = Count of contacts with "Reminder Optin" OR "Replay Optin" OR "Promo Optin"

const emailEngagement = {
  broadcastSubscribers: countTaggedContacts([14827, 14831, 14835]), // Optin tags
  emailClickers: countTaggedContacts([14859]), // Clicked NTN In Email
  reminderOptouts: countTaggedContacts([14829]), // Churn tracking
  replayOptouts: countTaggedContacts([14833]),
  promoOptouts: countTaggedContacts([14837])
}
```

### 2. Lead Quality Distribution (List Defender)
```typescript
const leadQuality = {
  green: countTaggedContacts([14789]), // Green - Safe to send
  yellow: countTaggedContacts([14793]), // Yellow - Re-engage
  red: countTaggedContacts([14791]), // Red - Do not send
  
  highEngagement: countTaggedContacts([14799]),
  lowEngagement: countTaggedContacts([14801]),
  neverEngaged: countTaggedContacts([14805]),
  
  // Risk flags
  disposable: countTaggedContacts([14783]),
  suspicious: countTaggedContacts([14787]),
  invalidEmails: countTaggedContacts([14761, 14763, 14765, 14767, 14769])
}
```

### 3. Wisdom Challenge Funnel
```typescript
const wisdomFunnel = {
  totalOptins: countTaggedContacts([14705, 14703]), // Historical + Trigger
  vipBuyers: countTaggedContacts([14753, 14749]), // Historical + Trigger
  journalBuyers: countTaggedContacts([14813]),
  kingdomSeekerTrials: countTaggedContacts([14857]),
  
  // Conversion rates
  vipTakeRate: (vipBuyers / totalOptins) * 100,
  journalUpsellRate: (journalBuyers / vipBuyers) * 100
}
```

---

## 🎨 UI Components para Implementar

### Component 1: Email Engagement Card
```
┌─────────────────────────────────────┐
│ 📧 Email Engagement                 │
├─────────────────────────────────────┤
│ Broadcast Subscribers: 1,234        │
│ Email Click Rate: 12.5%             │
│ Reminder Opt-ins: 890               │
│ Replay Opt-ins: 456                 │
│ Promo Opt-ins: 678                  │
└─────────────────────────────────────┘
```

### Component 2: Lead Quality Dashboard
```
┌─────────────────────────────────────┐
│ 🛡️ Lead Quality (List Defender)     │
├─────────────────────────────────────┤
│ ✅ Green (Safe): 1,000 (80%)        │
│ ⚠️ Yellow (Re-engage): 150 (12%)    │
│ 🔴 Red (Do Not Send): 100 (8%)      │
├─────────────────────────────────────┤
│ High Engagement: 800                │
│ Low Engagement: 200                 │
│ Never Engaged: 250                  │
├─────────────────────────────────────┤
│ 🚨 Risk Flags:                      │
│ Disposable Emails: 50               │
│ Suspicious: 30                      │
│ Invalid: 20                         │
└─────────────────────────────────────┘
```

### Component 3: Tag Distribution Chart
```
Wisdom Challenge Tags Distribution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIP Buyers         ████████████ 45%
Reminder Optin     ██████████ 38%
Replay Optin       ████████ 25%
Promo Optin        ██████ 18%
Journal Buyers     ████ 12%
Kingdom Seekers    ██ 8%
```

---

## 🔧 Implementação Técnica

### Backend: server/keap.ts
```typescript
export async function getKeapTags() {
  // GET /v1/tags
  // Returns all tags with IDs and names
}

export async function getContactsByTag(tagId: number) {
  // GET /v1/tags/{tagId}/contacts
  // Returns all contacts with specific tag
}

export async function getTagDistribution(tagIds: number[]) {
  // For each tag ID, count contacts
  // Return { tagId, tagName, count }
}
```

### tRPC Procedures
```typescript
keap: router({
  emailEngagement: publicProcedure.query(async () => {
    // Fetch counts for email engagement tags
    return {
      broadcastSubscribers,
      emailClickers,
      clickRate
    }
  }),
  
  leadQuality: publicProcedure.query(async () => {
    // Fetch List Defender tag counts
    return {
      green, yellow, red,
      highEngagement, lowEngagement
    }
  }),
  
  tagDistribution: publicProcedure
    .input(z.object({ tagIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      // Return distribution for specified tags
    })
})
```

---

## 📝 Próximos Passos

1. ✅ Analisar estrutura das tags (concluído)
2. ⏳ Implementar OAuth 2.0 para Keap API
3. ⏳ Criar helper functions em server/keap.ts
4. ⏳ Criar tRPC procedures para tags
5. ⏳ Implementar UI components no dashboard
6. ⏳ Testar integração end-to-end
