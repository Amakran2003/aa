#!/usr/bin/env python3
"""Bloque le force-push sur main et l'ajout des fichiers qui restent locaux."""

from __future__ import annotations

import json
import re
import sys

FORBIDDEN = (
    "EBOOK_BUSINESS_HALAL.pdf",
    "ebook/content.jsonl",
    "ebook/manifest.json",
    "ebook/images",
    "docs/WhatsApp",
)

FORCE_PUSH = re.compile(
    r"\bgit\s+push\b.*(?:--force\b|-f\b).*\bmain\b|\bgit\s+push\b.*\bmain\b.*(?:--force\b|-f\b)",
    re.IGNORECASE,
)
ADD_ENV = re.compile(r"(?:^|\s)\.env(?!\.example\b)\b", re.IGNORECASE)


def deny(user_message: str, agent_message: str) -> None:
    json.dump(
        {
            "permission": "deny",
            "user_message": user_message,
            "agent_message": agent_message,
        },
        sys.stdout,
    )
    sys.stdout.write("\n")


def allow() -> None:
    json.dump({"permission": "allow"}, sys.stdout)
    sys.stdout.write("\n")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        allow()
        return 0

    command = str(payload.get("command") or "")

    if FORCE_PUSH.search(command):
        deny(
            "Force-push sur main refusé.",
            "Le hook git de ce dépôt interdit git push --force sur main.",
        )
        return 0

    if re.search(r"\bgit\s+add\b", command, re.IGNORECASE) and ADD_ENV.search(command):
        deny(
            "Un fichier .env ne se commit pas.",
            "Le hook git a refusé git add sur un .env. Utiliser .env.example.",
        )
        return 0

    if re.search(r"\bgit\s+add\b", command, re.IGNORECASE):
        for name in FORBIDDEN:
            if name in command:
                deny(
                    "Ce fichier reste en local. Il ne va pas sur le dépôt public.",
                    f"Le hook git a refusé d'ajouter {name}.",
                )
                return 0

    allow()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
