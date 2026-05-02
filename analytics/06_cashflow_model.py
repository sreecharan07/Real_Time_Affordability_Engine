"""Module 06 — 30-Day Cash Flow Projection Model."""
import os
import pandas as pd
from datetime import date, timedelta
import plotly.graph_objects as go
from config import COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_profile, load_bills, load_subscriptions


def project_balance(profile, bills, subs, days=30):
    today   = date.today()
    balance = profile['current_balance']
    payday  = profile['payday_date']
    income  = profile['monthly_income']
    buffer  = profile['safety_buffer']
    records = []
    for i in range(days + 1):
        d = today + timedelta(days=i)
        dom = d.day
        income_today = expenses_today = 0.0
        events = []
        if dom == payday and i > 0:
            income_today = income
            events.append(f'Payday +${income:,.0f}')
        for _, bill in bills.iterrows():
            if bill['due_day'] == dom and i > 0:
                expenses_today += bill['amount']
                events.append(f"{bill['name']} -${bill['amount']:,.0f}")
        if dom == 1 and i > 0:
            sub_total = subs['amount'].sum()
            if sub_total > 0:
                expenses_today += sub_total
                events.append(f'Subscriptions -${sub_total:,.2f}')
        balance = balance + income_today - expenses_today
        records.append({'date': d, 'day': i, 'balance': round(balance, 2),
                        'income': income_today, 'expenses': expenses_today,
                        'events': '; '.join(events) if events else 'No events',
                        'above_buffer': balance >= buffer})
    return pd.DataFrame(records)


def build_projection(proj, profile):
    fig = go.Figure()
    fig.add_hrect(y0=0, y1=profile['safety_buffer'],
                  fillcolor='rgba(239,68,68,0.1)', line_width=0,
                  annotation_text='Safety Buffer Zone', annotation_position='top left',
                  annotation_font=dict(color=COLORS['danger'], size=10))
    fig.add_hline(y=profile['safety_buffer'], line_dash='dash', line_color=COLORS['danger'], opacity=0.6,
                  annotation_text=f"Buffer: ${profile['safety_buffer']:,.0f}", annotation_position='top right',
                  annotation_font=dict(color=COLORS['danger'], size=10))
    fig.add_trace(go.Scatter(
        x=proj['date'], y=proj['balance'], mode='lines',
        line=dict(color=COLORS['accent'], width=2.5), name='Projected Balance',
        customdata=proj['events'],
        hovertemplate='<b>%{x|%b %d}</b><br>Balance: $%{y:,.2f}<br>%{customdata}<extra></extra>',
    ))
    danger_pts = proj[~proj['above_buffer']]
    if not danger_pts.empty:
        fig.add_trace(go.Scatter(x=danger_pts['date'], y=danger_pts['balance'], mode='markers',
                                 marker=dict(size=8, color=COLORS['danger'], symbol='x',
                                             line=dict(color=COLORS['danger'], width=2)),
                                 name='Below Buffer',
                                 hovertemplate='<b>DANGER</b><br>%{x|%b %d}: $%{y:,.2f}<extra></extra>'))
    events_df = proj[proj['expenses'] > 0]
    if not events_df.empty:
        fig.add_trace(go.Scatter(x=events_df['date'], y=events_df['balance'], mode='markers',
                                 marker=dict(size=10, color=COLORS['warning'], symbol='triangle-down',
                                             line=dict(color=COLORS['base'], width=1)),
                                 name='Bill Payment', text=events_df['events'],
                                 hovertemplate='<b>%{x|%b %d}</b><br>%{text}<br>After: $%{y:,.2f}<extra></extra>'))
    payday_df = proj[proj['income'] > 0]
    if not payday_df.empty:
        fig.add_trace(go.Scatter(x=payday_df['date'], y=payday_df['balance'], mode='markers',
                                 marker=dict(size=12, color=COLORS['safe'], symbol='star',
                                             line=dict(color=COLORS['base'], width=1)),
                                 name='Payday',
                                 hovertemplate='<b>Payday!</b><br>%{x|%b %d}: $%{y:,.2f}<extra></extra>'))
    apply_theme(fig, title='30-Day Balance Projection', height=460,
                xaxis_title='Date', yaxis_title='Balance ($)', hovermode='x unified')
    return fig


def build_cashflow_bars(proj):
    ef = proj[(proj['income'] > 0) | (proj['expenses'] > 0)]
    if ef.empty: return go.Figure()
    fig = go.Figure()
    fig.add_trace(go.Bar(x=ef['date'], y=ef['income'], name='Income', marker_color=COLORS['safe'],
                         hovertemplate='<b>%{x|%b %d}</b><br>Income: +$%{y:,.2f}<extra></extra>'))
    fig.add_trace(go.Bar(x=ef['date'], y=-ef['expenses'], name='Expenses', marker_color=COLORS['danger'],
                         hovertemplate='<b>%{x|%b %d}</b><br>Expenses: -$%{y:,.2f}<extra></extra>'))
    apply_theme(fig, title='Daily Cash Flow Events (Next 30 Days)', height=360,
                xaxis_title='Date', yaxis_title='Amount ($)', barmode='relative')
    return fig


def run():
    profile = load_profile()
    if not profile:
        print('No profile found.'); return None, None
    bills = load_bills()
    subs  = load_subscriptions()
    proj  = project_balance(profile, bills, subs, days=30)
    days_below = (~proj['above_buffer']).sum()

    print(f"\n{'='*50}")
    print("  MODULE 06 — CASH FLOW PROJECTION (30 Days)")
    print(f"{'='*50}")
    print(f"  Starting Balance   : ${profile['current_balance']:>10,.2f}")
    print(f"  Projected Min      : ${proj['balance'].min():>10,.2f}")
    print(f"  Safety Buffer      : ${profile['safety_buffer']:>10,.2f}")
    print(f"  Days Below Buffer  : {days_below}")
    if days_below > 0:
        print(f"  ⚠  Balance dips below safety buffer on {days_below} day(s)!")
    print()
    for _, row in proj[proj['events'] != 'No events'].iterrows():
        print(f"    {row['date']}  {row['events']}  → Balance: ${row['balance']:,.2f}")
    print()

    fig_p = build_projection(proj, profile)
    fig_b = build_cashflow_bars(proj)
    fig_p.write_html(os.path.join(OUTPUT_DIR, '06_balance_projection.html'))
    fig_b.write_html(os.path.join(OUTPUT_DIR, '06_cashflow_bars.html'))
    print('  Charts saved: 06_balance_projection.html, 06_cashflow_bars.html')
    return fig_p, fig_b


if __name__ == '__main__':
    run()
