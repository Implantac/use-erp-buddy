import os
import requests
import json

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Try searching JSONB column with ilike
resp = requests.get(
    f"{url}/rest/v1/webhook_logs?or=(payload.ilike.%test%)&limit=1",
    headers=headers
)

print(f"Status: {resp.status_code}")
print(f"Body: {resp.text}")
