"""Module 07 — Python Affordability Decision Engine + Simulation."""
import os
import pandas as pd
from datetime import date, timedelta
from dataclasses import dataclass
from typing import Literal
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from config import COLORS, OUTPUT_DIR, apply_theme
from data_loader import load_profile, load_bills, load_subscriptions


@dataclass
class AffordabilityResult:
    decision:               str
    score:                  int
    projected_balance:      float
    disposable_balance:     float
    balance_after_purchase: float
    reasons:                list
    recommendation:         str
    safe_spend_limit:       float
    next_safe_date:         date
    upcoming_bills_total:   float
    days_until_payday:      int


def check_affordability(purchase_amount, profile, bills, subs, check_date=None):
    today        = check_date or date.today()
    current_day  = today.day
    try:
        days_in_month = (date(today.year, today.month % 12 + 1, 1) - timedelta(days=1)).day
    except ValueError:
        days_in_month = 31

    payday_day = profile.get('payday_date', 1)
    if payday_day > current_day:
        days_until_payday = payday_day - current_day
    else:
        days_until_payday = days_in_month - current_day + payday_day

    def is_upcoming(due_day):
        if payday_day > current_day:
            return current_day < due_day <= payday_day
        else:
            return due_day > current_day or due_day <= payday_day

    upcoming        = bills[bills['due_day'].apply(is_upcoming)]
    total_upcoming  = upcoming['amount'].sum()
    total_subs      = subs['amount'].sum()
    savings_goal    = profile.get('savings_goal', 0)
    safety_buffer   = profile.get('safety_buffer', 300)
    current_balance = profile['current_balance']

    disposable_balance     = current_balance - total_upcoming - total_subs - savings_goal - safety_buffer
    projected_balance      = current_balance - purchase_amount - total_upcoming - total_subs - savings_goal
    balance_after_purchase = current_balance - purchase_amount

    reasons = []
    score   = 100

    rent_bills = bills[(bills['category'] == 'rent') | (bills['name'].str.lower().str.contains('rent'))]
    if not rent_bills.empty:
        rent_due_day = int(rent_bills.iloc[0]['due_day'])
        days_to_rent = rent_due_day - current_day if rent_due_day > current_day else days_in_month - current_day + rent_due_day
        if days_to_rent <= 7:
            reasons.append('Rent due soon')
            score -= 20

    if total_subs > 100:
        reasons.append('Subscription load is high')
        score -= 10

    if purchase_amount > disposable_balance:
        reasons.append('Purchase exceeds free cash flow')
        score -= 25

    if balance_after_purchase < safety_buffer:
        reasons.append('Safety buffer will be broken')
        score -= 30

    if projected_balance < 0:
        reasons.append('Purchase may cause missed bill risk')
        score -= 25

    if not reasons:
        reasons.append('You are still safe after this purchase')

    score = max(0, min(100, score))
    if score >= 70:   decision = 'SAFE'
    elif score >= 40: decision = 'RISKY'
    else:             decision = 'NOT_RECOMMENDED'

    safe_spend_limit = max(0.0, disposable_balance)
    next_safe_date   = today + timedelta(days=days_until_payday)

    if decision == 'SAFE':
        rec = f"Safe to purchase. Projected balance: ${projected_balance:.2f} after all obligations."
    elif decision == 'RISKY':
        rec = f"Proceed with caution. Consider waiting {days_until_payday} days until payday."
    else:
        rec = f"Not recommended. Wait until payday ({next_safe_date}) for more disposable income."

    return AffordabilityResult(
        decision=decision, score=score,
        projected_balance=round(projected_balance, 2),
        disposable_balance=round(disposable_balance, 2),
        balance_after_purchase=round(balance_after_purchase, 2),
        reasons=reasons, recommendation=rec,
        safe_spend_limit=round(safe_spend_limit, 2),
        next_safe_date=next_safe_date,
        upcoming_bills_total=round(total_upcoming, 2),
        days_until_payday=days_until_payday,
    )


def batch_simulate(profile, bills, subs, amounts):
    rows = []
    for amt in amounts:
        r = check_affordability(amt, profile, bills, subs)
        rows.append({'purchase_amount': amt, 'decision': r.decision, 'score': r.score,
                     'projected_balance': r.projected_balance,
                     'disposable_balance': r.disposable_balance,
                     'safe_spend_limit': r.safe_spend_limit})
    return pd.DataFrame(rows)


def build_simulation(sim_df, profile):
    dc = {'SAFE': COLORS['safe'], 'RISKY': COLORS['warning'], 'NOT_RECOMMENDED': COLORS['danger']}
    point_colors = [dc[d] for d in sim_df['decision']]
    fig = make_subplots(rows=2, cols=1,
                        subplot_titles=['Affordability Score vs Purchase Amount',
                                        'Projected Balance vs Purchase Amount'],
                        vertical_spacing=0.16, shared_xaxes=True)
    fig.add_trace(go.Scatter(x=sim_df['purchase_amount'], y=sim_df['score'],
                             mode='lines+markers', line=dict(color=COLORS['accent'], width=2),
                             marker=dict(size=7, color=point_colors, line=dict(color=COLORS['base'], width=1)),
                             name='Score',
                             hovertemplate='Amount: $%{x:,.0f}<br>Score: %{y}<extra></extra>'), row=1, col=1)
    for y_val, color, label in [(70, COLORS['safe'], 'SAFE ≥70'), (40, COLORS['warning'], 'RISKY ≥40')]:
        fig.add_hline(y=y_val, line_dash='dash', line_color=color, opacity=0.5, row=1, col=1,
                      annotation_text=label, annotation_position='right',
                      annotation_font=dict(color=color, size=9))
    fig.add_trace(go.Scatter(x=sim_df['purchase_amount'], y=sim_df['projected_balance'],
                             mode='lines+markers', line=dict(color=COLORS['warning'], width=2),
                             marker=dict(size=7, color=point_colors, line=dict(color=COLORS['base'], width=1)),
                             name='Projected Balance',
                             hovertemplate='Amount: $%{x:,.0f}<br>Projected: $%{y:,.2f}<extra></extra>'), row=2, col=1)
    fig.add_hline(y=profile['safety_buffer'], line_dash='dash', line_color=COLORS['danger'], opacity=0.5, row=2, col=1,
                  annotation_text=f"Safety Buffer ${profile['safety_buffer']:,.0f}", annotation_position='right',
                  annotation_font=dict(color=COLORS['danger'], size=9))
    fig.add_hline(y=0, line_dash='solid', line_color=COLORS['muted'], opacity=0.3, row=2, col=1)
    fig.update_xaxes(title_text='Purchase Amount ($)', row=2, col=1)
    fig.update_yaxes(title_text='Score', row=1, col=1)
    fig.update_yaxes(title_text='Balance ($)', row=2, col=1)
    apply_theme(fig, title='Affordability Engine Simulation — Score & Balance vs Purchase Amount',
                height=580, showlegend=False)
    return fig


def build_zones(sim_df):
    dc = {'SAFE': COLORS['safe'], 'RISKY': COLORS['warning'], 'NOT_RECOMMENDED': COLORS['danger']}
    dl = {'SAFE': 'SAFE', 'RISKY': 'RISKY', 'NOT_RECOMMENDED': 'NOT RECOMMENDED'}
    fig = go.Figure()
    for decision in ['SAFE','RISKY','NOT_RECOMMENDED']:
        df = sim_df[sim_df['decision'] == decision]
        if not df.empty:
            color = dc[decision]
            r, g, b = int(color[1:3],16), int(color[3:5],16), int(color[5:7],16)
            fig.add_trace(go.Scatter(
                x=df['purchase_amount'], y=df['score'],
                fill='tozeroy', fillcolor=f'rgba({r},{g},{b},0.15)',
                line=dict(color=color, width=2), mode='lines',
                name=dl[decision],
                hovertemplate=f'<b>{dl[decision]}</b><br>Amount: $%{{x:,.0f}}<br>Score: %{{y}}<extra></extra>',
            ))
    apply_theme(fig, title='Safe Spending Zones by Purchase Amount', height=380,
                xaxis_title='Purchase Amount ($)', yaxis_title='Affordability Score')
    return fig


def run():
    profile = load_profile()
    if not profile:
        print('No profile found.'); return None, None
    bills = load_bills()
    subs  = load_subscriptions()

    print(f"\n{'='*50}")
    print("  MODULE 07 — PYTHON AFFORDABILITY ENGINE")
    print(f"{'='*50}")
    print(f"  {'Amount':>8}  {'Decision':<20}  {'Score':>5}  {'Proj Bal':>12}")
    print(f"  {'─'*8}  {'─'*20}  {'─'*5}  {'─'*12}")
    for amt in [50, 150, 300, 500, 800]:
        r = check_affordability(amt, profile, bills, subs)
        print(f"  ${amt:>7,.0f}  {r.decision:<20}  {r.score:>5}  ${r.projected_balance:>11,.2f}")
    r0 = check_affordability(0, profile, bills, subs)
    print(f"\n  Safe Spend Limit: ${r0.safe_spend_limit:,.2f}\n")

    max_amount = profile['current_balance'] * 1.2
    step = max(1, int(max_amount / 80))
    amounts = list(range(0, int(max_amount) + step, step))
    sim_df = batch_simulate(profile, bills, subs, amounts)

    fig_s = build_simulation(sim_df, profile)
    fig_z = build_zones(sim_df)
    fig_s.write_html(os.path.join(OUTPUT_DIR, '07_engine_simulation.html'))
    fig_z.write_html(os.path.join(OUTPUT_DIR, '07_safe_zones.html'))
    print('  Charts saved: 07_engine_simulation.html, 07_safe_zones.html')
    return fig_s, fig_z


if __name__ == '__main__':
    run()
