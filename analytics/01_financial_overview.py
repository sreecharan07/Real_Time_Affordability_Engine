"""Module 01 — Financial Overview: Waterfall + Donut."""
import os
import plotly.graph_objects as go
from config import COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_profile, load_bills, load_subscriptions


def build_waterfall(profile, total_bills, total_subs):
    labels   = ['Monthly Income','Fixed Bills','Subscriptions','Savings Goal','Safety Buffer','Free Cash Flow']
    values   = [profile['monthly_income'], -total_bills, -total_subs,
                -profile['savings_goal'], -profile['safety_buffer'], 0]
    measures = ['absolute','relative','relative','relative','relative','total']
    fig = go.Figure(go.Waterfall(
        orientation='v', measure=measures, x=labels, y=values,
        text=[f"${abs(v):,.0f}" for v in values], textposition='outside',
        connector=dict(line=dict(color=COLORS['border'], width=1, dash='dot')),
        increasing=dict(marker_color=COLORS['safe']),
        decreasing=dict(marker_color=COLORS['danger']),
        totals=dict(marker_color=COLORS['accent']),
        textfont=dict(color=COLORS['text'], size=12),
    ))
    apply_theme(fig, title='Monthly Cash Flow Waterfall', height=420, showlegend=False)
    return fig


def build_donut(profile, total_bills, total_subs):
    free_cash = profile['monthly_income'] - total_bills - total_subs - profile['savings_goal'] - profile['safety_buffer']
    labels = ['Fixed Bills','Subscriptions','Savings Goal','Safety Buffer','Free Cash Flow']
    values = [total_bills, total_subs, profile['savings_goal'], profile['safety_buffer'], max(free_cash, 0)]
    colors_list = [COLORS['danger'], COLORS['warning'], COLORS['safe'], COLORS['purple'], COLORS['teal']]
    fig = go.Figure(go.Pie(
        labels=labels, values=values, hole=0.55,
        marker=dict(colors=colors_list, line=dict(color=COLORS['base'], width=2)),
        textinfo='label+percent',
        textfont=dict(size=12, color=COLORS['text']),
        hovertemplate='<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>',
    ))
    fig.add_annotation(
        text=f"${profile['monthly_income']:,.0f}<br><span style='font-size:11px'>Income</span>",
        x=0.5, y=0.5, showarrow=False,
        font=dict(size=16, color=COLORS['text']), align='center',
    )
    apply_theme(fig, title='Monthly Income Allocation', height=420,
                legend=dict(orientation='v', x=1.02, y=0.5,
                            bgcolor=COLORS['surface'], bordercolor=COLORS['border'],
                            font=dict(color=COLORS['text'])))
    return fig


def run():
    profile = load_profile()
    if not profile:
        print('No profile found.')
        return None, None
    bills = load_bills()
    subs  = load_subscriptions()
    total_bills = bills['amount'].sum()
    total_subs  = subs['amount'].sum()
    free_cash   = profile['monthly_income'] - total_bills - total_subs - profile['savings_goal'] - profile['safety_buffer']
    ratio       = (total_bills + total_subs + profile['savings_goal']) / profile['monthly_income'] * 100

    print(f"\n{'='*50}")
    print("  MODULE 01 — FINANCIAL OVERVIEW")
    print(f"{'='*50}")
    print(f"  Monthly Income   : ${profile['monthly_income']:>10,.2f}")
    print(f"  Fixed Bills      : ${total_bills:>10,.2f}")
    print(f"  Subscriptions    : ${total_subs:>10,.2f}")
    print(f"  Savings Goal     : ${profile['savings_goal']:>10,.2f}")
    print(f"  Safety Buffer    : ${profile['safety_buffer']:>10,.2f}")
    print(f"  Free Cash Flow   : ${free_cash:>10,.2f}")
    print(f"  Spending Ratio   : {ratio:.1f}% of income\n")

    fig_wf = build_waterfall(profile, total_bills, total_subs)
    fig_dn = build_donut(profile, total_bills, total_subs)
    fig_wf.write_html(os.path.join(OUTPUT_DIR, '01_waterfall.html'))
    fig_dn.write_html(os.path.join(OUTPUT_DIR, '01_donut.html'))
    print('  Charts saved: 01_waterfall.html, 01_donut.html')
    return fig_wf, fig_dn


if __name__ == '__main__':
    run()
