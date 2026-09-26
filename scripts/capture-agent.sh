#!/usr/bin/env bash

set -euo pipefail

INPUT="$(cat)"

python3 - "$INPUT" <<'PY'
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

payload = json.loads(sys.argv[1])

conversation_id = payload.get("conversationId")
transcript_path = payload.get("transcriptPath")
model_name = payload.get("modelName", "Unknown")

if not conversation_id or not transcript_path:
    print("{}")
    raise SystemExit(0)

log_dir = Path.cwd().parent / ".agent-logs"
log_dir.mkdir(parents=True, exist_ok=True)

entries = []

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue

        if entry.get("status") != "DONE":
            continue

        entry_type = entry.get("type")
        content = entry.get("content", "")

        if entry_type == "USER_INPUT":
            match = re.search(
                r"<USER_REQUEST>\n(.*?)\n</USER_REQUEST>",
                content,
                re.DOTALL
            )

            if match:
                entries.append({
                    "type": "user",
                    "content": match.group(1),
                    "timestamp": entry.get("created_at")
                })

        elif entry_type == "PLANNER_RESPONSE" and content:
            entries.append({
                "type": "assistant",
                "content": content,
                "timestamp": entry.get("created_at")
            })

if not entries:
    print("{}")
    raise SystemExit(0)

timestamp = entries[0]["timestamp"]

dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
filename_time = dt.astimezone(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")

log_path = log_dir / f"{filename_time}_{conversation_id}.md"

lines = [
    "# Agent Session Log",
    "",
    f"- **Session ID:** `{conversation_id}`",
    f"- **Model:** {model_name}",
    f"- **UTC Timestamp:** {timestamp}",
    "",
    "---",
    ""
]

for entry in entries:
    if entry["type"] == "user":
        lines.extend([
            "## User Prompt",
            "",
            entry["content"],
            "",
        ])
    else:
        lines.extend([
            "## Final Response",
            "",
            entry["content"],
            "",
        ])

log_path.write_text("\n".join(lines), encoding="utf-8")

print("{}")
PY
