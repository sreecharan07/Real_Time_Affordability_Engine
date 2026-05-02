"""Run all AffordIQ analytics modules and generate the full HTML report.

Usage:
    cd analytics
    python run_all.py

Outputs are written to the 'output/' subdirectory (or AFFORDIQ_OUTPUT env var).
"""
import os
import sys
import importlib
from config import OUTPUT_DIR

os.makedirs(OUTPUT_DIR, exist_ok=True)

print()
print('╔══════════════════════════════════════════════╗')
print('║       AffordIQ — Analytics Suite             ║')
print('╚══════════════════════════════════════════════╝')
print()

modules = [
    ('01_financial_overview',    'Module 01 — Financial Overview'),
    ('02_spending_risk',         'Module 02 — Spending Risk'),
    ('03_bills_analysis',        'Module 03 — Bills Analysis'),
    ('04_subscriptions_analysis','Module 04 — Subscriptions'),
    ('05_affordability_checks',  'Module 05 — Affordability Checks'),
    ('06_cashflow_model',        'Module 06 — Cash Flow Projection'),
    ('07_affordability_engine',  'Module 07 — Decision Engine'),
]

for mod_name, label in modules:
    try:
        mod = importlib.import_module(mod_name)
        mod.run()
        print(f'  ✓ {label}')
    except Exception as e:
        print(f'  ✗ {label}: {e}')
        import traceback; traceback.print_exc()

try:
    import report_builder
    report_builder.build_report()
    print()
    print(f'  ✓ Full report: {os.path.join(OUTPUT_DIR, "report.html")}')
except Exception as e:
    print(f'  ✗ Report generation failed: {e}')
    import traceback; traceback.print_exc()

print()
print(f'Done! Open {os.path.join(OUTPUT_DIR, "report.html")} in your browser.')
print()
