# pg_cron Setup Guide for Supabase

This guide will help you configure automated refresh of the `wisdom_contacts` materialized view every 30 minutes using pg_cron.

## 📋 Prerequisites

- Access to Supabase SQL Editor
- Database admin privileges
- `wisdom_contacts` materialized view already created (from migration 003)

## 🚀 Quick Start (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Enable pg_cron Extension

Copy and paste this command:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

Click **Run** (or press Ctrl+Enter).

**Expected result:** Success message or "extension already exists"

### Step 3: Create the Cron Job

Copy and paste this command:

```sql
SELECT cron.schedule(
  'refresh_wisdom_contacts',
  '*/30 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;'
);
```

Click **Run**.

**Expected result:** Returns a job ID (e.g., `1` or `2`)

### Step 4: Verify Job Was Created

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'refresh_wisdom_contacts';
```

**Expected output:**

| jobid | jobname | schedule | command | active |
|-------|---------|----------|---------|--------|
| 1 | refresh_wisdom_contacts | */30 * * * * | REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts; | t |

✅ **You're done!** The view will now refresh automatically every 30 minutes.

---

## 📊 Monitoring & Verification

### Check Job Execution History

```sql
SELECT 
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_wisdom_contacts')
ORDER BY start_time DESC
LIMIT 10;
```

### Check for Failed Runs

```sql
SELECT 
  runid,
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_wisdom_contacts')
  AND status = 'failed'
ORDER BY start_time DESC;
```

### Verify View is Up-to-Date

```sql
SELECT 
  (SELECT COUNT(*) FROM wisdom_contacts) as view_count,
  (SELECT COUNT(DISTINCT contact_id) FROM analytics_events 
   WHERE comment ILIKE '%wisdom%' 
      OR comment ILIKE '%31daywisdomchallenge%') as direct_count;
```

**If counts match:** View is up-to-date ✅  
**If counts differ:** View needs manual refresh (see below)

---

## 🔧 Manual Operations

### Trigger Immediate Refresh

If you don't want to wait for the next scheduled run:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
```

### Change Schedule

To run every hour instead of every 30 minutes:

```sql
-- First, unschedule the old job
SELECT cron.unschedule('refresh_wisdom_contacts');

-- Then create new job with different schedule
SELECT cron.schedule(
  'refresh_wisdom_contacts',
  '0 * * * *',  -- Every hour at minute 0
  'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;'
);
```

### Disable Job (Without Deleting)

```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'refresh_wisdom_contacts';
```

### Re-enable Job

```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'refresh_wisdom_contacts';
```

### Delete Job Completely

```sql
SELECT cron.unschedule('refresh_wisdom_contacts');
```

---

## 🕐 Schedule Format Reference

The schedule uses standard cron syntax: `minute hour day month weekday`

**Common schedules:**

| Schedule | Description |
|----------|-------------|
| `*/30 * * * *` | Every 30 minutes |
| `0 * * * *` | Every hour at minute 0 |
| `0 */2 * * *` | Every 2 hours |
| `0 0 * * *` | Daily at midnight |
| `0 6 * * *` | Daily at 6:00 AM |
| `0 */6 * * *` | Every 6 hours |

---

## ⚠️ Troubleshooting

### Problem: "extension pg_cron does not exist"

**Solution:** pg_cron might not be available in your Supabase plan.

1. Check Supabase Dashboard → Database → Extensions
2. Look for `pg_cron` in the list
3. If not available, contact Supabase support

**Alternative:** Use manual refresh via n8n workflow (schedule HTTP request to trigger refresh)

### Problem: "permission denied to create extension"

**Solution:** You need admin privileges.

1. Ensure you're using the `postgres` user
2. Check your Supabase project settings
3. Contact Supabase support if needed

### Problem: Job created but not running

**Check 1:** Verify job is active

```sql
SELECT active FROM cron.job WHERE jobname = 'refresh_wisdom_contacts';
```

Should return `t` (true).

**Check 2:** Check for errors in job history

```sql
SELECT return_message 
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_wisdom_contacts')
  AND status = 'failed'
ORDER BY start_time DESC
LIMIT 1;
```

**Check 3:** Verify UNIQUE index exists

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'wisdom_contacts' 
  AND indexdef LIKE '%UNIQUE%';
```

Should return `idx_wisdom_contacts_contact_id`.

### Problem: View refreshing but dashboard not updating

**Cause:** Frontend cache (React Query) might be serving stale data.

**Solution:** Use the "Refresh Data" button in the dashboard, or wait 2 minutes for cache to expire.

---

## 📈 Performance Impact

- **Refresh duration:** ~100-500ms (depends on data size)
- **Blocking:** None (CONCURRENTLY allows queries during refresh)
- **CPU impact:** Minimal (runs in background)
- **Recommended frequency:** 30 minutes (balances freshness vs load)

---

## ✅ Success Checklist

- [ ] pg_cron extension enabled
- [ ] Cron job created (`refresh_wisdom_contacts`)
- [ ] Job appears in `cron.job` table with `active = t`
- [ ] First run completed successfully (check `cron.job_run_details`)
- [ ] View count matches direct query count
- [ ] Dashboard shows updated data

---

## 📝 Notes

1. **Timezone:** pg_cron runs in UTC by default
2. **Concurrency:** CONCURRENTLY requires UNIQUE index (already created)
3. **Logging:** All runs are logged in `cron.job_run_details` (kept for 7 days)
4. **Automatic cleanup:** Old logs are automatically deleted after 7 days
5. **Database-specific:** Job only runs in the database where it was created

---

## 🔗 Related Files

- `003_materialized_views.sql` - Creates the wisdom_contacts view
- `004_refresh_wisdom_contacts.sql` - Manual refresh script (removes orphaned contacts)
- `005_pg_cron_setup.sql` - Full SQL script with all commands

---

## 📞 Need Help?

If you encounter issues:

1. Check Supabase logs: Dashboard → Database → Logs
2. Review `cron.job_run_details` for error messages
3. Contact Supabase support (mention pg_cron)
4. Alternative: Use n8n scheduled workflow for manual refresh

---

**Last updated:** 2025-12-13  
**Tested on:** Supabase PostgreSQL 15.x
