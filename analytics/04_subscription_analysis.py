"""Module 04 — Subscriptions Analysis."""
import os
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from config import COLORS, CATEGORY_COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_subscriptions, load_profile


def build_bars(subs):
    df = subs.sort_values('amount', ascending=False)
    colors_list = [CATEGORY_COLORS.get(c, COLORS['muted']) for c in df['category']]
    fig = go.Figure(go.Bar(
        x=df['name'], y=df['amount'], marker_color=colors_list,
        text=[f'${a:.2f}' for a in df['amount']], textposition='outside',
        textfont=dict(color=COLORS['text'], size=11),
        hovertemplate='<b>%{x}</b><br>$%{y:.2f}/mo<br>$%{customdata:.2f}/yr<extra></extra>',
        customdata=df['amount'] * 12,
    ))
    apply_theme(fig, title='Monthly Subscription Costs', height=360, showlegend=False,
                yaxis_title='Monthly Cost ($)')
    return fig


def build_annual(subs, profile):
    df = subs.sort_values('amount', ascending=False).copy()
    df['annual'] = df['amount'] * 12
    colors_list = [CATEGORY_COLORS.get(c, COLORS['muted']) for c in df['category']]
    fig = make_subplots(rows=1, cols=2,
                        subplot_titles=['Monthly Cost', 'Annual Cost (Projected)'],
                        horizontal_spacing=0.1)
    fig.add_trace(go.Bar(name='Monthly', x=df['name'], y=df['amount'], marker_color=colors_list,
                         text=[f'${a:.2f}' for a in df['amount']], textposition='outside',
                         textfont=dict(color=COLORS['text'], size=10), showlegend=False), row=1, col=1)
    fig.add_trace(go.Bar(name='Annual', x=df['name'], y=df['annual'], marker_color=colors_list,
                         text=[f'${a:.0f}' for a in df['annual']], textposition='outside',
                         textfont=dict(color=COLORS['text'], size=10), showlegend=False), row=1, col=2)
    total_annual = df['annual'].sum()
    pct = total_annual / (profile['monthly_income'] * 12) * 100
    fig.add_annotation(
        text=f"Total annual subscription cost: <b>${total_annual:,.2f}</b> ({pct:.1f}% of annual income)",
        xref='paper', yref='paper', x=0.5, y=-0.12, showarrow=False,
        font=dict(size=12, color=COLORS['muted']), align='center')
    apply_theme(fig, title='Subscription Cost: Monthly vs Annual Projection', height=400)
    return fig


def build_treemap(subs):
    df = subs.copy()
    df['cat_label'] = df['category'].str.replace('_', ' ').str.title()
    cats = df['cat_label'].unique().tolist()
    fig = go.Figure(go.Treemap(
        labels=df['name'].tolist() + cats + ['Subscriptions'],
        parents=df['cat_label'].tolist() + ['Subscriptions'] * len(cats) + [''],
        values=df['amount'].tolist() + [0] * len(cats) + [0],
        texttemplate='<b>%{label}</b><br>$%{value:.2f}/mo',
        hovertemplate='<b>%{label}</b><br>$%{value:.2f}/mo<extra></extra>',
        marker=dict(
            colors=[CATEGORY_COLORS.get(c, COLORS['muted']) for c in df['category'].tolist()] +
                   [COLORS['surface']] * len(cats) + [COLORS['base']],
            line=dict(color=COLORS['base'], width=2)),
        root_color=COLORS['base'],
    ))
    apply_theme(fig, title='Subscription Spending Treemap', height=380)
    return fig


def run():
    subs    = load_subscriptions()
    profile = load_profile()
    if subs.empty:
        print('No subscriptions data.'); return None, None, None
    total_monthly = subs['amount'].sum()
    print(f"\n{'='*50}")
    print("  MODULE 04 — SUBSCRIPTIONS ANALYSIS")
    print(f"{'='*50}")
    print(f"  Total Monthly Cost : ${total_monthly:,.2f}")
    print(f"  Total Annual Cost  : ${total_monthly*12:,.2f}")
    if profile:
        print(f"  % of Monthly Income: {total_monthly/profile['monthly_income']*100:.1f}%")
    print(f"  Number of Subs     : {len(subs)}")
    print(f"  Most Expensive     : {subs.loc[subs['amount'].idxmax(),'name']} (${subs['amount'].max():.2f}/mo)\n")
    for cat, amt in subs.groupby('category')['amount'].sum().sort_values(ascending=False).items():
        print(f"    {cat:<12} ${amt:.2f}/mo  (${amt*12:.2f}/yr)")
    print()
    fig_b = build_bars(subs)
    fig_a = build_annual(subs, profile or {'monthly_income': total_monthly * 20})
    fig_t = build_treemap(subs)
    fig_b.write_html(os.path.join(OUTPUT_DIR, '04_subscriptions_bars.html'))
    fig_a.write_html(os.path.join(OUTPUT_DIR, '04_annual_projection.html'))
    fig_t.write_html(os.path.join(OUTPUT_DIR, '04_treemap.html'))
    print('  Charts saved: 04_subscriptions_bars.html, 04_annual_projection.html, 04_treemap.html')
    return fig_b, fig_a, fig_t


if __name__ == '__main__':
    run()
