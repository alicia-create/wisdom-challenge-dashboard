# Development Guidelines

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm tsc --noEmit

# Database migration
pnpm db:push
```

## Project Structure

```
client/src/
├── pages/          # Page components (one per route)
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and configurations
└── contexts/       # React contexts

server/
├── routers.ts      # tRPC API routes
├── supabase.ts     # Database queries
├── cache.ts        # In-memory caching
└── _core/          # Framework code (don't modify)

shared/
└── constants.ts    # Shared types and constants
```

## Code Conventions

### TypeScript
- **Always use explicit types** - avoid `any` unless absolutely necessary
- **Null safety** - use optional chaining (`?.`) and nullish coalescing (`??`)
- **Type imports** - use `import type` for type-only imports

### React
- **Functional components only** - no class components
- **Hooks at top level** - never inside conditions or loops
- **Custom hooks** - prefix with `use` (e.g., `useAuth`)
- **Loading states** - always show skeleton/spinner during data fetching

### Database Queries
- **Use Supabase client** - all queries go through `server/supabase.ts`
- **Filter by date** - always respect date range parameters
- **Aggregate in DB** - use SQL aggregations, not JavaScript loops
- **Cache expensive queries** - use `cache.ts` for queries > 1 second

### API Routes (tRPC)
- **Input validation** - use Zod schemas for all inputs
- **Error handling** - wrap in try/catch and return meaningful errors
- **Cache when possible** - add caching for read-heavy endpoints
- **Log important operations** - use `console.log` with prefixes like `[Overview Metrics]`

## Performance Best Practices

### Backend
1. **Cache aggressively** - 5-10 minute TTL for dashboard metrics
2. **Batch queries** - use `Promise.all()` for parallel fetches
3. **Index database columns** - add indexes for frequently filtered columns
4. **Avoid N+1 queries** - fetch related data in single query

### Frontend
1. **Lazy load routes** - use React.lazy() for page components
2. **Memoize expensive calculations** - use `useMemo` for derived data
3. **Debounce user input** - wait 300ms before triggering searches
4. **Optimize images** - compress and use appropriate formats

## Common Patterns

### Adding a New Metric

1. **Add database query** in `server/supabase.ts`:
```typescript
export async function getMyMetric(startDate?: string, endDate?: string) {
  let query = supabase.from('table').select('*');
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  return query;
}
```

2. **Add tRPC procedure** in `server/routers.ts`:
```typescript
myMetric: publicProcedure
  .input(z.object({ dateRange: z.enum([...]).optional() }))
  .query(async ({ input }) => {
    const { startDate, endDate } = getDateRangeValues(input.dateRange);
    const cacheKey = `metric:${input.dateRange}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    const result = await getMyMetric(startDate, endDate);
    cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }),
```

3. **Use in frontend**:
```typescript
const { data, isLoading } = trpc.myMetric.useQuery({ dateRange });
```

### Adding a New Page

1. Create component in `client/src/pages/MyPage.tsx`
2. Add route in `client/src/App.tsx`:
```typescript
<Route path="/my-page" component={MyPage} />
```
3. Add navigation link in `DashboardLayout.tsx` or header

## Testing

### Unit Tests (Vitest)
- Test critical business logic
- Mock Supabase client for database tests
- Test date filtering and aggregations
- Run with `pnpm test`

### Manual Testing Checklist
- [ ] Date range filter works correctly
- [ ] Loading states display properly
- [ ] Error states handled gracefully
- [ ] Mobile responsive (test at 375px width)
- [ ] No console errors in browser

## Debugging Tips

### Backend Issues
1. Check server logs: `pm2 logs wisdom-challenge-dashboard`
2. Verify Supabase connection: check `SUPABASE_URL` and `SUPABASE_KEY`
3. Test query directly: use `webdev_execute_sql` tool

### Frontend Issues
1. Check browser console for errors
2. Verify tRPC query is being called (check Network tab)
3. Check if data is cached (look for cache logs)
4. Use React DevTools to inspect component state

### Performance Issues
1. Check cache hit rate: `cache.getStats()`
2. Profile slow queries with Supabase dashboard
3. Use Chrome DevTools Performance tab
4. Check bundle size: `pnpm build --analyze`

## Deployment

**DO NOT manually deploy.** Use the Manus UI:
1. Create checkpoint: `webdev_save_checkpoint`
2. Click "Publish" button in Management UI
3. Monitor deployment logs in Dashboard panel

## Troubleshooting

### "TypeScript errors"
- Run `pnpm tsc --noEmit` to see all errors
- Fix null safety issues with `|| []` or `?.`
- Add explicit types to function parameters

### "Database query returns empty"
- Check if table has data: `SELECT COUNT(*) FROM table`
- Verify date format: use `YYYY-MM-DD` format
- Check column names match schema

### "Cache not working"
- Verify cache key is consistent
- Check TTL hasn't expired
- Clear cache manually: `cache.clear()`

## Resources

- [tRPC Documentation](https://trpc.io)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Recharts Examples](https://recharts.org/en-US/examples)
