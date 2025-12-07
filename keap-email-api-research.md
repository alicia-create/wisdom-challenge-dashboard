# Keap Email API Research

## Available Endpoints:

### GET /v1/emails
**Purpose**: Retrieve a list of emails that have been sent

**Query Parameters**:
- `contact_id` (integer) - Optional Contact Id to find Emails for
- `email` (string) - Optional email address to query on
- `limit` (integer) - Sets a total of items to return
- `offset` (integer) - Sets a beginning range of items to return
- `ordered` (boolean) - Default: true - Optional boolean to turn off ORDER BY in SQL query
- `since_sent_date` (string) - Optional date to query on, emails sent since the provided date
- `until_sent_date` (string) - Optional date to query on, email sent until the provided date

**Note**: Keap is currently investigating an issue with degraded performance of this endpoint with very large (millions of records) record sets

**Response**: Returns list of sent emails with metadata

---

## Limitations Found:

1. **No Open Rate Endpoint**: The API does not expose an endpoint to get email open statistics
2. **No Click Rate Endpoint**: The API does not expose an endpoint to get email click statistics
3. **No Campaign Statistics**: No aggregate metrics for email campaigns (opens, clicks, bounces)

## Available Data via Tags:

Based on the CSV files provided, we have these tags:
- **Clicked NTN In Email** (14859) - Contacts who clicked on emails
- **Reminder/Replay/Promo Optin** - Contacts subscribed to email types
- **Reminder/Replay/Promo Optout** - Contacts unsubscribed from email types

## Recommended Approach:

Since the Keap REST API v1 does NOT provide email open/click statistics, we must rely on **tags** for tracking:

### Click Rate Calculation:
```
Click Rate = (Contacts with "Clicked NTN In Email" tag) / (Total Broadcast Subscribers) * 100
```

Where:
- **Numerator**: Count of contacts with tag 14859 (Clicked NTN In Email) AND Wisdom tags
- **Denominator**: Count of contacts with ANY opt-in tag (Reminder/Replay/Promo) AND Wisdom tags

### Wisdom Filter:
To get Wisdom-only subset, we need to intersect with Wisdom tags:
- Historical Optin (14705)
- Trigger Optin (14703)
- NTN General Opt In (14707)
- NTN VIP Opt In (14711)

## Alternative: Keap XML-RPC API

The older XML-RPC API (deprecated but still available) has more email tracking capabilities:
- `DataService.query()` with `ContactAction` table can get email opens/clicks
- More complex to implement and not recommended for new integrations

## Conclusion:

**For MVP, use tag-based click rate calculation**. To get true open/click rates with campaign-level data, would need to:
1. Use Keap's built-in reporting UI (not accessible via API)
2. Use third-party email service (SendGrid, Mailchimp) integrated with Keap
3. Implement custom tracking links with UTM parameters
