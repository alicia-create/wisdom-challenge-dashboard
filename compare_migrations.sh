#!/bin/bash

echo "=== Checking Migration 031 vs v15 ==="
echo ""

echo "Fields in v15 paidAdsFunnel:"
grep -A 15 "'paidAdsFunnel'" migrations/006_unified_dashboard_metrics_v15.sql | grep "'" | head -20

echo ""
echo "Fields in 031 paidAdsFunnel:"
grep -A 15 "'paidAdsFunnel'" migrations/031_fix_product_id_logic.sql | grep "'" | head -20

echo ""
echo "=== Checking for missing sections ==="
echo ""

echo "Sections in v15:"
grep "jsonb_build_object" migrations/006_unified_dashboard_metrics_v15.sql | grep "'" | cut -d"'" -f2 | sort | uniq

echo ""
echo "Sections in 031:"
grep "jsonb_build_object" migrations/031_fix_product_id_logic.sql | grep "'" | cut -d"'" -f2 | sort | uniq
