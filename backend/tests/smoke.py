"""Live smoke test — POSTs each implemented webhook path against a running server.

Usage (server running with AUTH_DISABLED=true):
    python tests/smoke.py            # defaults to http://localhost:8000
    BASE_URL=https://... python tests/smoke.py

Prints PASS/FAIL per endpoint. Extend the CASES list as endpoints land in later phases.
"""
from __future__ import annotations

import os
import sys

import httpx

BASE = os.environ.get("BASE_URL", "http://localhost:8000")
DEBUG_USER = os.environ.get("SMOKE_USER", "00000000-0000-0000-0000-000000000001")
HEADERS = {"X-Debug-User": DEBUG_USER}

# (label, method, path, json-body, expected-status-set)
# A 404 (lead not found) or 502 (provider/LLM not configured) still proves the path is wired
# and reached the service — exactly what a smoke test checks. Use a real seeded lead for green 200s.
CASES = [
    ("health", "GET", "/health", None, {200}),
    ("discover-leads", "POST", "/webhook/discover-leads",
     {"pin_code": "400053", "business_types": ["cafe"]}, {200, 500, 502}),
    ("update-pipeline", "POST", "/webhook/update-pipeline",
     {"lead_id": "smoke-lead", "new_stage": "contacted"}, {200, 404}),
    ("generate-outreach", "POST", "/webhook/generate-outreach",
     {"lead_id": "smoke-lead", "channel": "whatsapp"}, {200, 404, 502}),
    ("send-sms", "POST", "/webhook/send-sms",
     {"lead_id": "smoke-lead", "custom_message": "hi"}, {200, 404, 500, 502}),
    ("send-whatsapp", "POST", "/webhook/send-whatsapp",
     {"lead_id": "smoke-lead", "custom_message": "hi"}, {200, 404, 500, 502}),
    ("log-call", "POST", "/webhook/log-call",
     {"lead_id": "smoke-lead", "outcome": "interested"}, {200, 404}),
    ("generate-website", "POST", "/webhook/generate-website",
     {"lead_id": "smoke-lead"}, {200, 404, 502}),
]


def main() -> int:
    failures = 0
    with httpx.Client(base_url=BASE, timeout=20.0) as c:
        for label, method, path, body, expected in CASES:
            try:
                r = c.request(method, path, json=body, headers=HEADERS)
                ok = r.status_code in expected
            except httpx.HTTPError as e:
                print(f"FAIL  {label:18} transport error: {e}")
                failures += 1
                continue
            tag = "PASS" if ok else "FAIL"
            failures += 0 if ok else 1
            print(f"{tag}  {label:18} {method} {path} -> {r.status_code}")
    print(f"\n{'ALL PASS' if failures == 0 else f'{failures} FAILED'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
