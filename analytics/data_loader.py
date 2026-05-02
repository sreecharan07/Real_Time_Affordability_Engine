"""Fetch and prepare all AffordIQ data from Supabase into pandas DataFrames."""
import pandas as pd
from config import supabase


def load_profile():
    """Load the most recent financial profile."""
    res = supabase.table('financial_profiles').select('*').order('id', desc=True).limit(1).execute()
    if res.data:
        p = res.data[0]
        return {
            'id':             p['id'],
            'monthly_income': float(p['monthly_income']),
            'current_balance':float(p['current_balance']),
            'savings_goal':   float(p.get('savings_goal') or 250),
            'safety_buffer':  float(p.get('safety_buffer') or 300),
            'payday_date':    int(p.get('payday_date') or 1),
        }
    return None


def load_bills():
    """Load all bills as a DataFrame."""
    res = supabase.table('bills').select('*').execute()
    if not res.data:
        return pd.DataFrame(columns=['id','name','amount','due_day','category','is_recurring'])
    df = pd.DataFrame(res.data)
    df['amount'] = df['amount'].astype(float)
    df['due_day'] = df['due_day'].astype(int)
    return df


def load_subscriptions():
    """Load all subscriptions as a DataFrame."""
    res = supabase.table('subscriptions').select('*').execute()
    if not res.data:
        return pd.DataFrame(columns=['id','name','amount','billing_cycle','category'])
    df = pd.DataFrame(res.data)
    df['amount'] = df['amount'].astype(float)
    return df


def load_checks():
    """Load all affordability checks as a DataFrame."""
    res = supabase.table('affordability_checks').select('*').order('created_at', desc=False).execute()
    if not res.data:
        return pd.DataFrame(columns=['id','purchase_amount','category','merchant_name',
                                     'purchase_date','decision','score',
                                     'projected_balance','disposable_balance',
                                     'reasons','recommendation','created_at'])
    df = pd.DataFrame(res.data)
    df['purchase_amount']    = df['purchase_amount'].astype(float)
    df['score']              = pd.to_numeric(df['score'], errors='coerce')
    df['projected_balance']  = pd.to_numeric(df['projected_balance'], errors='coerce')
    df['disposable_balance'] = pd.to_numeric(df['disposable_balance'], errors='coerce')
    df['created_at']         = pd.to_datetime(df['created_at'], utc=True)
    df['month']              = df['created_at'].dt.to_period('M').astype(str)
    df['date']               = df['created_at'].dt.date
    return df


def load_all():
    """Load everything and return (profile, bills_df, subs_df, checks_df)."""
    return load_profile(), load_bills(), load_subscriptions(), load_checks()
