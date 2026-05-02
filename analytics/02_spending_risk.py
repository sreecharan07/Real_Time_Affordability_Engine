"""Module 02 — Spending Risk Analysis."""
import os
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from config import COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_profile, load_bills, load_subscriptions


def classify_risk(ratio):
    if ratio < 0.5:  return 'LOW',    COLORS['safe']
    if ratio < 0.75: return 'MEDIUM', COLORS['warning']
    return 'HIGH', COLORS['danger']


def build_gauge(spending_ratio, risk_label, risk_color):
    fig = go.Figure(go.Indicator(
        mode='gauge+number+delta',
        value=round(spending_ratio * 100, 1),
        title=dict(text=f'Spending Ratio  ·  {risk_label} RISK', font=dict(size=16, color=COLORS['text'])),
        number=dict(suffix='%', font=dict(size=36, color=risk_color)),
        delta=dict(reference=50, increasing=dict(color=COLORS['danger']), decreasing=dict(color=COLORS['safe'])),
        gauge=dict(
            axis=dict(range=[0, 100], tickwidth=1, tickcolor=COLORS['muted'], tickfont=dict(color=COLORS['muted'])),
            bar=dict(color=risk_color, thickness=0.25),
            bgcolor=COLORS['surface'],
            borderwidth=1, bordercolor=COLORS['border'],
            steps=[
                dict(range=[0,  50], color='rgba(5,46,22,0.8)'),
                dict(range=[50, 75], color='rgba(28,19,0,0.8)'),
                dict(range=[75,100], color='rgba(45,10,10,0.8)'),
            ],
            threshold=dict(line=dict(color=COLORS['text'], width=2), thickness=0.75, value=spending_ratio*100),
        ),
    ))
    apply_theme(fig, height=320, margin=dict(l=40, r=40, t=80, b=20))
    return fig


def build_bars(profile, total_bills, total_subs):
    categories  = ['Fixed Bills','Subscriptions','Savings Goal','Safety Buffer']
    amounts     = [total_bills, total_subs, profile['savings_goal'], profile['safety_buffer']]
    colors_list = [COLORS['danger'], COLORS['warning'], COLORS['safe'], COLORS['purple']]
    pcts        = [a / profile['monthly_income'] * 100 for a in amounts]

    fig = make_subplots(rows=1, cols=2,
                        subplot_titles=['Obligation Amounts ($)', 'As % of Monthly Income'],
                        horizontal_spacing=0.12)
    fig.add_trace(go.Bar(x=categories, y=amounts, marker_color=colors_list,
                         text=[f'${a:,.0f}' for a in amounts], textposition='outside',
                         textfont=dict(color=COLORS['text'], size=11), showlegend=False,
                         hovertemplate='<b>%{x}</b><br>$%{y:,.2f}<extra></extra>'), row=1, col=1)
    fig.add_trace(go.Bar(x=categories, y=pcts, marker_color=colors_list,
                         text=[f'{p:.1f}%' for p in pcts], textposition='outside',
                         textfont=dict(color=COLORS['text'], size=11), showlegend=False,
                         hovertemplate='<b>%{x}</b><br>%{y:.1f}% of income<extra></extra>'), row=1, col=2)
    apply_theme(fig, title='Obligations Breakdown vs Monthly Income', height=400)
    fig.update_yaxes(gridcolor=COLORS['border'])
    return fig


def run():
    profile = load_profile()
    if not profile:
        print('No profile found.'); return None, None
    bills = load_bills()
    subs  = load_subscriptions()
    total_bills = bills['amount'].sum()
    total_subs  = subs['amount'].sum()
    total_oblig = total_bills + total_subs + profile['savings_goal']
    ratio = total_oblig / profile['monthly_income']
    risk_label, risk_color = classify_risk(ratio)

    print(f"\n{'='*50}")
    print("  MODULE 02 — SPENDING RISK ANALYSIS")
    print(f"{'='*50}")
    print(f"  Total Obligations : ${total_oblig:>10,.2f}")
    print(f"  Monthly Income    : ${profile['monthly_income']:>10,.2f}")
    print(f"  Spending Ratio    : {ratio*100:>9.1f}%")
    print(f"  Risk Level        : {risk_label}\n")

    fig_g = build_gauge(ratio, risk_label, risk_color)
    fig_b = build_bars(profile, total_bills, total_subs)
    fig_g.write_html(os.path.join(OUTPUT_DIR, '02_risk_gauge.html'))
    fig_b.write_html(os.path.join(OUTPUT_DIR, '02_obligations_bars.html'))
    print('  Charts saved: 02_risk_gauge.html, 02_obligations_bars.html')
    return fig_g, fig_b


if __name__ == '__main__':
    run()
