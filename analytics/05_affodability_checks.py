"""Module 05 — Affordability Checks Analysis."""
import os
import plotly.graph_objects as go
from config import COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_checks


def build_donut(checks):
    counts = checks['decision'].value_counts().reindex(['SAFE','RISKY','NOT_RECOMMENDED'], fill_value=0)
    fig = go.Figure(go.Pie(
        labels=['Safe','Risky','Not Recommended'], values=counts.values, hole=0.55,
        marker=dict(colors=[COLORS['safe'],COLORS['warning'],COLORS['danger']],
                    line=dict(color=COLORS['base'], width=2)),
        textinfo='label+value+percent', textfont=dict(size=12, color=COLORS['text']),
        hovertemplate='<b>%{label}</b><br>%{value} checks (%{percent})<extra></extra>',
    ))
    fig.add_annotation(text=f"{len(checks)}<br><span style='font-size:11px'>Total Checks</span>",
                       x=0.5, y=0.5, showarrow=False, font=dict(size=18, color=COLORS['text']), align='center')
    apply_theme(fig, title='Affordability Decision Distribution', height=380)
    return fig


def build_histogram(checks):
    fig = go.Figure()
    for x0, x1, color, label in [
        (0,  40, 'rgba(239,68,68,0.12)',  'NOT REC.'),
        (40, 70, 'rgba(245,158,11,0.12)', 'RISKY'),
        (70, 100,'rgba(34,197,94,0.12)',  'SAFE'),
    ]:
        fig.add_vrect(x0=x0, x1=x1, fillcolor=color, line_width=0,
                      annotation_text=label, annotation_position='top',
                      annotation_font=dict(color=COLORS['muted'], size=10))
    dc = {'SAFE': COLORS['safe'], 'RISKY': COLORS['warning'], 'NOT_RECOMMENDED': COLORS['danger']}
    for decision, grp in checks.groupby('decision'):
        if grp['score'].notna().any():
            fig.add_trace(go.Histogram(
                x=grp['score'].dropna(), name=decision.replace('_',' ').title(),
                marker_color=dc.get(decision, COLORS['muted']), opacity=0.85,
                xbins=dict(start=0, end=100, size=5),
                hovertemplate='Score %{x}: %{y} checks<extra></extra>',
            ))
    apply_theme(fig, title='Affordability Score Distribution', height=380,
                xaxis_title='Score (0-100)', yaxis_title='Number of Checks', barmode='overlay')
    return fig


def build_category(checks):
    if checks['category'].isna().all():
        return go.Figure()
    pivot = checks.groupby(['category','decision']).size().unstack(fill_value=0)
    for col in ['SAFE','RISKY','NOT_RECOMMENDED']:
        if col not in pivot.columns: pivot[col] = 0
    fig = go.Figure()
    for decision, color in [('SAFE',COLORS['safe']),('RISKY',COLORS['warning']),('NOT_RECOMMENDED',COLORS['danger'])]:
        if decision in pivot.columns:
            fig.add_trace(go.Bar(name=decision.replace('_',' ').title(), x=pivot.index, y=pivot[decision],
                                 marker_color=color,
                                 hovertemplate='<b>%{x}</b><br>' + decision + ': %{y}<extra></extra>'))
    apply_theme(fig, title='Checks by Purchase Category & Decision', height=400,
                xaxis_title='Category', yaxis_title='Number of Checks', barmode='stack')
    return fig


def build_scatter(checks):
    dc = {'SAFE': COLORS['safe'], 'RISKY': COLORS['warning'], 'NOT_RECOMMENDED': COLORS['danger']}
    dl = {'SAFE': 'Safe', 'RISKY': 'Risky', 'NOT_RECOMMENDED': 'Not Recommended'}
    fig = go.Figure()
    for decision, grp in checks.groupby('decision'):
        grp = grp.dropna(subset=['score','purchase_amount'])
        fig.add_trace(go.Scatter(
            x=grp['purchase_amount'], y=grp['score'], mode='markers',
            name=dl.get(decision, decision),
            marker=dict(size=12, color=dc.get(decision, COLORS['muted']),
                        line=dict(color=COLORS['base'], width=1), opacity=0.85),
            text=grp['merchant_name'].fillna('Unknown'),
            hovertemplate='<b>%{text}</b><br>Amount: $%{x:,.2f}<br>Score: %{y}<extra></extra>',
        ))
    for y_val, color, label in [(70, COLORS['safe'], 'SAFE threshold'), (40, COLORS['warning'], 'RISKY threshold')]:
        fig.add_hline(y=y_val, line_dash='dash', line_color=color, opacity=0.5,
                      annotation_text=label, annotation_position='right',
                      annotation_font=dict(color=color, size=10))
    apply_theme(fig, title='Purchase Amount vs Affordability Score', height=420,
                xaxis_title='Purchase Amount ($)', yaxis_title='Affordability Score')
    return fig


def run():
    checks = load_checks()
    if checks.empty:
        print('No affordability checks data.'); return None, None, None, None
    print(f"\n{'='*50}")
    print("  MODULE 05 — AFFORDABILITY CHECKS")
    print(f"{'='*50}")
    print(f"  Total Checks       : {len(checks)}")
    for d in ['SAFE','RISKY','NOT_RECOMMENDED']:
        n = (checks['decision'] == d).sum()
        print(f"  {d:<20}: {n:>3} ({n/len(checks)*100:.0f}%)")
    if checks['score'].notna().any():
        print(f"  Avg Score          : {checks['score'].mean():.1f}")
    print(f"  Avg Purchase Amount: ${checks['purchase_amount'].mean():,.2f}\n")
    fig_d = build_donut(checks)
    fig_h = build_histogram(checks)
    fig_c = build_category(checks)
    fig_s = build_scatter(checks)
    fig_d.write_html(os.path.join(OUTPUT_DIR, '05_decision_donut.html'))
    fig_h.write_html(os.path.join(OUTPUT_DIR, '05_score_histogram.html'))
    fig_c.write_html(os.path.join(OUTPUT_DIR, '05_category_analysis.html'))
    fig_s.write_html(os.path.join(OUTPUT_DIR, '05_amount_vs_score.html'))
    print('  Charts saved: 05_decision_donut.html, 05_score_histogram.html, 05_category_analysis.html, 05_amount_vs_score.html')
    return fig_d, fig_h, fig_c, fig_s


if __name__ == '__main__':
    run()
