"""Module 03 — Bills & Fixed Expenses Analysis."""
import os
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from config import COLORS, CATEGORY_COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_bills


def build_bar(bills):
    df = bills.sort_values('amount', ascending=True)
    colors_list = [CATEGORY_COLORS.get(c, COLORS['muted']) for c in df['category']]
    fig = go.Figure(go.Bar(
        x=df['amount'], y=df['name'], orientation='h',
        marker_color=colors_list,
        text=[f'${a:,.2f}' for a in df['amount']], textposition='outside',
        textfont=dict(color=COLORS['text'], size=11),
        hovertemplate='<b>%{y}</b><br>$%{x:,.2f}<extra></extra>',
    ))
    apply_theme(fig, title='Fixed Bills by Amount', height=max(300, len(df)*52), showlegend=False,
                xaxis_title='Monthly Amount ($)')
    return fig


def build_pie(bills):
    cat = bills.groupby('category')['amount'].sum().reset_index().sort_values('amount', ascending=False)
    colors_list = [CATEGORY_COLORS.get(c, COLORS['muted']) for c in cat['category']]
    fig = go.Figure(go.Pie(
        labels=cat['category'].str.replace('_', ' ').str.title(),
        values=cat['amount'], hole=0.5,
        marker=dict(colors=colors_list, line=dict(color=COLORS['base'], width=2)),
        textinfo='label+percent', textfont=dict(size=12, color=COLORS['text']),
        hovertemplate='<b>%{label}</b><br>$%{value:,.2f} (%{percent})<extra></extra>',
    ))
    fig.add_annotation(text=f"${bills['amount'].sum():,.0f}<br><span style='font-size:11px'>Total/mo</span>",
                       x=0.5, y=0.5, showarrow=False, font=dict(size=16, color=COLORS['text']), align='center')
    apply_theme(fig, title='Bills by Category', height=400)
    return fig


def build_timeline(bills):
    df = bills.sort_values('due_day').copy()
    df['cumulative'] = df['amount'].cumsum()
    colors_list = [CATEGORY_COLORS.get(c, COLORS['muted']) for c in df['category']]
    fig = make_subplots(rows=2, cols=1,
                        subplot_titles=['Bill Due Dates (Day of Month)', 'Cumulative Spend as Bills Hit'],
                        vertical_spacing=0.18, row_heights=[0.45, 0.55])
    fig.add_trace(go.Scatter(
        x=df['due_day'], y=df['amount'], mode='markers+text',
        marker=dict(size=16, color=colors_list, line=dict(color=COLORS['base'], width=1.5)),
        text=df['name'], textposition='top center', textfont=dict(size=10, color=COLORS['text']),
        hovertemplate='<b>%{text}</b><br>Due: Day %{x}<br>$%{y:,.2f}<extra></extra>',
        showlegend=False,
    ), row=1, col=1)
    fig.add_trace(go.Scatter(
        x=df['due_day'], y=df['cumulative'], mode='lines+markers',
        line=dict(color=COLORS['danger'], width=2, shape='hv'),
        marker=dict(size=8, color=COLORS['danger']),
        fill='tozeroy', fillcolor='rgba(239,68,68,0.12)',
        name='Cumulative Bills',
        hovertemplate='Day %{x}: $%{y:,.2f} total due so far<extra></extra>',
    ), row=2, col=1)
    fig.update_xaxes(title_text='Day of Month', range=[0, 32])
    fig.update_yaxes(title_text='Amount ($)', row=1, col=1)
    fig.update_yaxes(title_text='Cumulative ($)', row=2, col=1)
    apply_theme(fig, title='Monthly Bill Due Date Calendar', height=580)
    return fig


def run():
    bills = load_bills()
    if bills.empty:
        print('No bills data.'); return None, None, None
    print(f"\n{'='*50}")
    print("  MODULE 03 — BILLS ANALYSIS")
    print(f"{'='*50}")
    print(f"  Total Monthly Bills : ${bills['amount'].sum():,.2f}")
    print(f"  Number of Bills     : {len(bills)}")
    print(f"  Largest Bill        : {bills.loc[bills['amount'].idxmax(), 'name']} (${bills['amount'].max():,.2f})")
    print(f"  Avg Bill Amount     : ${bills['amount'].mean():,.2f}\n")
    for cat, amt in bills.groupby('category')['amount'].sum().sort_values(ascending=False).items():
        print(f"    {cat:<15} ${amt:,.2f}")
    print()
    fig_bar  = build_bar(bills)
    fig_pie  = build_pie(bills)
    fig_time = build_timeline(bills)
    fig_bar.write_html(os.path.join(OUTPUT_DIR, '03_bills_bar.html'))
    fig_pie.write_html(os.path.join(OUTPUT_DIR, '03_bills_pie.html'))
    fig_time.write_html(os.path.join(OUTPUT_DIR, '03_due_date_timeline.html'))
    print('  Charts saved: 03_bills_bar.html, 03_bills_pie.html, 03_due_date_timeline.html')
    return fig_bar, fig_pie, fig_time


if __name__ == '__main__':
    run()
