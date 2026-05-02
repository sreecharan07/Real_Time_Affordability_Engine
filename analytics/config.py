"""Shared configuration and Supabase client for AffordIQ analytics."""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Try multiple locations for .env
for env_path in [
    os.path.join(os.path.dirname(__file__), '..', '.env'),
    os.path.join(os.path.dirname(__file__), '.env'),
    '/tmp/.env',
]:
    if os.path.exists(env_path):
        load_dotenv(dotenv_path=env_path)
        break

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError(
        "Missing Supabase credentials. "
        "Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Output directory — writable, configurable via env var
# Default to /tmp/affordiq_output if the local 'output/' dir is not writable
_local_output = os.path.join(os.path.dirname(__file__), 'output')
_tmp_output   = '/tmp/affordiq_output'
OUTPUT_DIR    = os.environ.get('AFFORDIQ_OUTPUT', _local_output)
try:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    # Test writability
    _test = os.path.join(OUTPUT_DIR, '.write_test')
    open(_test, 'w').close()
    os.remove(_test)
except (PermissionError, OSError):
    OUTPUT_DIR = _tmp_output
    os.makedirs(OUTPUT_DIR, exist_ok=True)

# Chart colours matching AffordIQ dark UI
COLORS = {
    'accent':  '#3b6ef8',
    'safe':    '#22c55e',
    'warning': '#f59e0b',
    'danger':  '#ef4444',
    'muted':   '#5a6480',
    'surface': '#161b27',
    'base':    '#0f1117',
    'text':    '#f0f4ff',
    'border':  '#1e2535',
    'purple':  '#8b5cf6',
    'cyan':    '#06b6d4',
    'teal':    '#10b981',
    'pink':    '#ec4899',
    'orange':  '#f97316',
}

CATEGORY_COLORS = {
    'rent':        COLORS['accent'],
    'utilities':   COLORS['purple'],
    'insurance':   COLORS['cyan'],
    'phone':       COLORS['warning'],
    'internet':    COLORS['teal'],
    'groceries':   '#3b82f6',
    'transport':   COLORS['pink'],
    'credit_card': COLORS['danger'],
    'other':       COLORS['muted'],
    'streaming':   COLORS['accent'],
    'music':       COLORS['teal'],
    'fitness':     COLORS['warning'],
    'software':    COLORS['purple'],
    'gaming':      COLORS['pink'],
    'news':        COLORS['cyan'],
}


def apply_theme(fig, title=None, height=None, **kwargs):
    """Apply the AffordIQ dark theme to a Plotly figure."""
    C = COLORS
    layout_kwargs = dict(
        paper_bgcolor=C['base'],
        plot_bgcolor=C['surface'],
        font=dict(family='Plus Jakarta Sans, Inter, sans-serif', color=C['text'], size=13),
        xaxis=dict(gridcolor=C['border'], linecolor=C['border'], tickfont=dict(color=C['muted'])),
        yaxis=dict(gridcolor=C['border'], linecolor=C['border'], tickfont=dict(color=C['muted'])),
        legend=dict(bgcolor=C['surface'], bordercolor=C['border'], font=dict(color=C['text'])),
        margin=dict(l=50, r=30, t=60, b=50),
    )
    if title:
        layout_kwargs['title'] = dict(text=title, font=dict(size=18, color=C['text']))
    if height:
        layout_kwargs['height'] = height
    layout_kwargs.update(kwargs)
    fig.update_layout(**layout_kwargs)
    return fig
