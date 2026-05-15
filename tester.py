import os
import uuid
import random
import time
import requests
from datetime import datetime, timezone

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars. "
        "Set them before running this script."
    )

url = f"{SUPABASE_URL}/rest/v1/telemetry"
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

while True:
    payload = {
        "telemetry_id": str(uuid.uuid4()),
        "pond_id": "pond-001",
        "ph": round(random.uniform(6.5, 8.5), 2),
        "temperature": round(random.uniform(24, 30), 2),
        "turbidity": round(random.uniform(0, 25), 2),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    res = requests.post(url, headers=headers, json=payload)
    print(res.status_code, res.text)
    time.sleep(3)