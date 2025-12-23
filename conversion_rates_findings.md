# Conversion Rates Investigation - 2025-12-23

## Current Status (ALL filter)

### Paid Ads Funnel
- **Leads → Wisdom+:** 0.0% converted, 100.0% dropped off ❌
  - Should be: 2,434 / 25,059 = 9.7% ✅ (shown in top card)
  
- **Wisdom+ → Kingdom Seekers:** 0.0% converted, 100.0% dropped off ✅
  - Correct: 0 / 2,434 = 0.0%
  
- **Kingdom Seekers → ManyChat:** 3.9% converted, 96.1% dropped off
  - Calculation: 986 / 25,059 = 3.9% (from total leads, not from Kingdom Seekers)
  
- **ManyChat → Bot Alerts:** 78.7% converted, 21.3% dropped off
  - Calculation: 776 / 986 = 78.7% ✅

### Organic Funnel
- **Leads → Wisdom+:** 16.8% converted, 83.2% dropped off ✅
  - Calculation: 1,134 / 6,758 = 16.8%
  
- **Wisdom+ → Kingdom Seekers:** 53.1% converted, 46.9% dropped off ✅
  - Calculation: 602 / 1,134 = 53.1%
  
- **Kingdom Seekers → ManyChat:** 14.7% converted, 85.3% dropped off
  - Calculation: 992 / 6,758 = 14.7% (from total leads, not from Kingdom Seekers)
  
- **ManyChat → Bot Alerts:** 82.1% converted, 17.9% dropped off ✅
  - Calculation: 814 / 992 = 82.1%

## Problem Identified

**Paid Ads Funnel: Leads → Wisdom+ shows 0.0% but should show 9.7%**

The frontend is receiving `leadToWisdomRate` from the API but it's showing 0.0% instead of 9.7%.

## Next Steps

1. Check browser console for API response
2. Verify `funnel.leadToWisdomRate` value in Overview.tsx
3. Check if ConversionFunnel component is receiving correct props
