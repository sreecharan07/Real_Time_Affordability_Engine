"""Build the full standalone AffordIQ HTML analytics report."""
import os
import importlib
import plotly.io as pio
from config import COLORS, OUTPUT_DIR
from data_loader import load_all


def fig_to_html(fig, div_id):
    if fig is None:
        return '<div style="padding:40px;text-align:center;color:#5a6480">No data available</div>'
    return pio.to_html(fig, full_html=False, include_plotlyjs=False, div_id=div_id,
                       config={'displayModeBar': True, 'responsive': True})


def get_fig(figs, mod, idx):
    result = figs.get(mod)
    if result is None: return None
    if isinstance(result, tuple): return result[idx] if idx < len(result) else None
    return result if idx == 0 else None


def build_report():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    profile, bills, subs, checks = load_all()
    if not profile:
        print('No profile found — cannot build report.'); return

    total_bills = bills['amount'].sum() if not bills.empty else 0
    total_subs  = subs['amount'].sum()  if not subs.empty  else 0
    total_oblig = total_bills + total_subs + profile['savings_goal']
    free_cash   = profile['monthly_income'] - total_oblig - profile['safety_buffer']
    ratio       = total_oblig / profile['monthly_income'] * 100
    risk        = 'LOW' if ratio < 50 else ('MEDIUM' if ratio < 75 else 'HIGH')
    risk_color  = {'LOW': COLORS['safe'], 'MEDIUM': COLORS['warning'], 'HIGH': COLORS['danger']}[risk]

    figs = {}
    for mod_name in ['01_financial_overview','02_spending_risk','03_bills_analysis',
                     '04_subscriptions_analysis','05_affordability_checks',
                     '06_cashflow_model','07_affordability_engine']:
        try:
            mod = importlib.import_module(mod_name)
            figs[mod_name] = mod.run()
        except Exception as e:
            figs[mod_name] = None

    C = COLORS
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AffordIQ — Python Analytics Report</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{{box-sizing:border-box}}
    body{{margin:0;padding:0;background:{C['base']};color:{C['text']};font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}}
    .header{{background:{C['surface']};border-bottom:1px solid {C['border']};padding:20px 40px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}}
    .logo{{display:flex;align-items:center;gap:12px}}
    .logo-icon{{width:40px;height:40px;border-radius:12px;background:{C['accent']};display:flex;align-items:center;justify-content:center;font-size:20px}}
    .logo-name{{font-size:22px;font-weight:900;letter-spacing:-0.5px}}
    .logo-sub{{font-size:12px;color:{C['muted']};margin-top:2px}}
    .badge{{font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:{C['accent']};color:white}}
    .hero{{padding:40px;background:linear-gradient(135deg,{C['surface']},{C['base']});border-bottom:1px solid {C['border']}}}
    .hero h1{{font-size:28px;font-weight:900;margin:0 0 6px}}
    .hero p{{color:{C['muted']};margin:0 0 28px;font-size:14px}}
    .kpi-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}}
    .kpi{{background:{C['surface']};border:1px solid {C['border']};border-radius:16px;padding:20px}}
    .kpi-label{{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:{C['muted']};margin-bottom:8px}}
    .kpi-value{{font-size:26px;font-weight:900}}
    .kpi-sub{{font-size:11px;color:{C['muted']};margin-top:4px}}
    .section{{padding:40px;border-bottom:1px solid {C['border']}}}
    .section:last-child{{border-bottom:none}}
    .sec-header{{display:flex;align-items:center;gap:12px;margin-bottom:24px}}
    .sec-num{{width:32px;height:32px;border-radius:10px;background:{C['accent']};color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}}
    .sec-title{{font-size:20px;font-weight:800}}
    .sec-desc{{font-size:13px;color:{C['muted']};margin-top:2px}}
    .chart-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:20px}}
    .chart-card{{background:{C['surface']};border:1px solid {C['border']};border-radius:16px;padding:20px;overflow:hidden}}
    .chart-card.full{{grid-column:1/-1}}
    .footer{{text-align:center;padding:32px;color:{C['muted']};font-size:12px;border-top:1px solid {C['border']}}}
    @media(max-width:768px){{.header,.hero,.section{{padding:16px 20px}}.chart-grid{{grid-template-columns:1fr}}}}
  </style>
</head>
<body>
<header class="header">
  <div class="logo">
    <div class="logo-icon">⚡</div>
    <div><div class="logo-name">AffordIQ</div><div class="logo-sub">Analytics Report</div></div>
  </div>
  <span class="badge">Python Analytics Suite</span>
</header>
<section class="hero">
  <h1>Financial Analytics Dashboard</h1>
  <p>Generated from live Supabase data · All charts are interactive · Built with Python + Plotly</p>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Monthly Income</div><div class="kpi-value" style="color:{C['accent']}">${profile['monthly_income']:,.0f}</div><div class="kpi-sub">CAD per month</div></div>
    <div class="kpi"><div class="kpi-label">Current Balance</div><div class="kpi-value" style="color:{C['safe']}">${profile['current_balance']:,.0f}</div><div class="kpi-sub">Available now</div></div>
    <div class="kpi"><div class="kpi-label">Total Obligations</div><div class="kpi-value" style="color:{C['danger']}">${total_oblig:,.0f}</div><div class="kpi-sub">Bills + subs + savings</div></div>
    <div class="kpi"><div class="kpi-label">Free Cash Flow</div><div class="kpi-value" style="color:{C['safe'] if free_cash>0 else C['danger']}">${free_cash:,.0f}</div><div class="kpi-sub">After all obligations</div></div>
    <div class="kpi"><div class="kpi-label">Spending Ratio</div><div class="kpi-value" style="color:{risk_color}">{ratio:.1f}%</div><div class="kpi-sub" style="color:{risk_color};font-weight:700">{risk} RISK</div></div>
    <div class="kpi"><div class="kpi-label">Fixed Bills</div><div class="kpi-value">{len(bills)}</div><div class="kpi-sub">${total_bills:,.0f}/month</div></div>
    <div class="kpi"><div class="kpi-label">Subscriptions</div><div class="kpi-value">{len(subs)}</div><div class="kpi-sub">${total_subs:,.2f}/month</div></div>
    <div class="kpi"><div class="kpi-label">Checks Run</div><div class="kpi-value">{len(checks)}</div><div class="kpi-sub">Affordability checks</div></div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">01</div><div><div class="sec-title">Financial Overview</div><div class="sec-desc">Income allocation waterfall and obligation breakdown</div></div></div>
  <div class="chart-grid">
    <div class="chart-card">{fig_to_html(get_fig(figs,'01_financial_overview',0),'fig01a')}</div>
    <div class="chart-card">{fig_to_html(get_fig(figs,'01_financial_overview',1),'fig01b')}</div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">02</div><div><div class="sec-title">Spending Risk Analysis</div><div class="sec-desc">Risk gauge and obligation breakdown as % of income</div></div></div>
  <div class="chart-grid">
    <div class="chart-card">{fig_to_html(get_fig(figs,'02_spending_risk',0),'fig02a')}</div>
    <div class="chart-card full">{fig_to_html(get_fig(figs,'02_spending_risk',1),'fig02b')}</div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">03</div><div><div class="sec-title">Bills &amp; Fixed Expenses</div><div class="sec-desc">Category breakdown, amounts, and due-date calendar timeline</div></div></div>
  <div class="chart-grid">
    <div class="chart-card">{fig_to_html(get_fig(figs,'03_bills_analysis',0),'fig03a')}</div>
    <div class="chart-card">{fig_to_html(get_fig(figs,'03_bills_analysis',1),'fig03b')}</div>
    <div class="chart-card full">{fig_to_html(get_fig(figs,'03_bills_analysis',2),'fig03c')}</div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">04</div><div><div class="sec-title">Subscription Analysis</div><div class="sec-desc">Monthly vs annual costs, category treemap</div></div></div>
  <div class="chart-grid">
    <div class="chart-card">{fig_to_html(get_fig(figs,'04_subscriptions_analysis',0),'fig04a')}</div>
    <div class="chart-card">{fig_to_html(get_fig(figs,'04_subscriptions_analysis',2),'fig04b')}</div>
    <div class="chart-card full">{fig_to_html(get_fig(figs,'04_subscriptions_analysis',1),'fig04c')}</div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">05</div><div><div class="sec-title">Affordability Check History</div><div class="sec-desc">Decision distribution, score histogram, category patterns, amount vs score</div></div></div>
  <div class="chart-grid">
    <div class="chart-card">{fig_to_html(get_fig(figs,'05_affordability_checks',0),'fig05a')}</div>
    <div class="chart-card">{fig_to_html(get_fig(figs,'05_affordability_checks',1),'fig05b')}</div>
    <div class="chart-card">{fig_to_html(get_fig(figs,'05_affordability_checks',2),'fig05c')}</div>
    <div class="chart-card">{fig_to_html(get_fig(figs,'05_affordability_checks',3),'fig05d')}</div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">06</div><div><div class="sec-title">30-Day Cash Flow Projection</div><div class="sec-desc">Day-by-day balance simulation with bill events and payday markers</div></div></div>
  <div class="chart-grid">
    <div class="chart-card full">{fig_to_html(get_fig(figs,'06_cashflow_model',0),'fig06a')}</div>
    <div class="chart-card full">{fig_to_html(get_fig(figs,'06_cashflow_model',1),'fig06b')}</div>
  </div>
</section>
<section class="section">
  <div class="sec-header"><div class="sec-num">07</div><div><div class="sec-title">Affordability Engine Simulation</div><div class="sec-desc">Python engine scoring every purchase amount — safe zone boundaries and projected balances</div></div></div>
  <div class="chart-grid">
    <div class="chart-card full">{fig_to_html(get_fig(figs,'07_affordability_engine',0),'fig07a')}</div>
    <div class="chart-card full">{fig_to_html(get_fig(figs,'07_affordability_engine',1),'fig07b')}</div>
  </div>
</section>
<footer class="footer">AffordIQ Analytics Report · Generated with Python + Plotly · Data from Supabase PostgreSQL</footer>
</body></html>"""

    report_path = os.path.join(OUTPUT_DIR, 'report.html')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'  Report written to {report_path}')


if __name__ == '__main__':
    build_report()
