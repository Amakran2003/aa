#!/usr/bin/env python3
"""Extract EBOOK_BUSINESS_HALAL.pdf into a reading-order JSONL plus images.

Each figure records the last real word of the text block that precedes it,
including when the figure sits at the top of the next page.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent
PDF_PATH = ROOT.parent / "EBOOK_BUSINESS_HALAL.pdf"
OUT_DIR = ROOT
IMAGE_DIR = OUT_DIR / "images"

# Full-page wash and the repeated "Business Halal" banner. Saved once, kept
# out of the reading flow so they do not steal the anchor of real figures.
CHROME_XREFS = {4, 12, 22, 18}

WORD_RE = re.compile(r"[^\s]+")
LEXICAL_RE = re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿ]")
PUNCT = ".,;:!?…\"“”«»()[]{}–—✅❌🔥📈📉🔍📝⚠️💵👊📷📱💡⭐📋🚛🛳️✈️🤝📖"


def clean_token(token: str) -> str:
    return token.strip(PUNCT)


def edge_word(text: str, *, last: bool) -> str | None:
    tokens = WORD_RE.findall(text or "")
    ordered = reversed(tokens) if last else iter(tokens)
    for token in ordered:
        cleaned = clean_token(token)
        if cleaned and LEXICAL_RE.search(cleaned):
            return cleaned
    return None


def edge_line(text: str, *, last: bool) -> str:
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    if not lines:
        return ""
    ordered = reversed(lines) if last else iter(lines)
    for line in ordered:
        if edge_word(line, last=True):
            return line
    return lines[-1] if last else lines[0]


def block_plain(block: dict) -> tuple[str, float, float]:
    lines: list[str] = []
    max_size = 0.0
    bold_chars = 0
    total_chars = 0
    for line in block.get("lines", []):
        parts: list[str] = []
        for span in line.get("spans", []):
            max_size = max(max_size, float(span.get("size") or 0))
            text = span.get("text") or ""
            parts.append(text)
            count = len(text.strip())
            total_chars += count
            if span.get("flags", 0) & 16:
                bold_chars += count
        joined = "".join(parts).strip()
        if joined:
            lines.append(joined)
    plain = "\n".join(lines)
    bold_ratio = (bold_chars / total_chars) if total_chars else 0.0
    return plain, max_size, bold_ratio


def text_role(text: str, max_size: float, bold_ratio: float) -> str:
    stripped = text.strip()
    if max_size >= 14 and len(stripped) < 220:
        return "heading"
    if bold_ratio > 0.8 and len(stripped) < 160 and stripped.count(".") <= 1:
        return "heading"
    return "body"


def round_box(bbox) -> list[float]:
    return [round(float(v), 1) for v in bbox]


def save_figure(doc: pymupdf.Document, page: pymupdf.Page, info: dict, path: Path) -> tuple[int, int]:
    path.parent.mkdir(parents=True, exist_ok=True)
    masked = bool(info.get("has-mask")) or bool(info.get("smask"))
    if masked:
        clip = pymupdf.Rect(info["bbox"])
        width = max(clip.width, 1)
        zoom = max(float(info.get("width") or width) / width, 1.5)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=False)
        pix.save(path)
        return pix.width, pix.height
    extracted = doc.extract_image(info["xref"])
    path.write_bytes(extracted["image"])
    return int(extracted["width"]), int(extracted["height"])


def collect(doc: pymupdf.Document) -> tuple[list[dict], list[dict]]:
    flow: list[dict] = []
    chrome: list[dict] = []
    saved_chrome: set[int] = set()

    for page_index, page in enumerate(doc):
        page_no = page_index + 1
        pending: list[tuple[float, float, dict]] = []

        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            text, max_size, bold_ratio = block_plain(block)
            if not text.strip():
                continue
            pending.append(
                (
                    float(block["bbox"][1]),
                    float(block["bbox"][0]),
                    {
                        "kind": "text",
                        "page": page_no,
                        "text": text,
                        "bbox": round_box(block["bbox"]),
                        "font_size": round(max_size, 1),
                        "role": text_role(text, max_size, bold_ratio),
                    },
                )
            )

        for info in page.get_image_info(xrefs=True):
            xref = int(info["xref"])
            bbox = info["bbox"]
            if xref in CHROME_XREFS:
                if xref not in saved_chrome:
                    saved_chrome.add(xref)
                    role = "header" if xref == 18 else "page_background"
                    name = "chrome-header.png" if xref == 18 else f"chrome-background-{xref}.png"
                    width, height = save_figure(doc, page, info, IMAGE_DIR / name)
                    chrome.append(
                        {
                            "xref": xref,
                            "role": role,
                            "file": f"images/{name}",
                            "width": width,
                            "height": height,
                            "first_page": page_no,
                        }
                    )
                continue
            pending.append(
                (
                    float(bbox[1]),
                    float(bbox[0]),
                    {
                        "kind": "image",
                        "page": page_no,
                        "xref": xref,
                        "bbox": round_box(bbox),
                        "info": info,
                        "page_obj": page,
                    },
                )
            )

        pending.sort(key=lambda item: (round(item[0] / 8) * 8, item[1]))
        flow.extend(item[2] for item in pending)

    return flow, chrome


def build_records(doc: pymupdf.Document, flow: list[dict]) -> list[dict]:
    records: list[dict] = []
    text_counts: dict[int, int] = {}
    image_counts: dict[int, int] = {}
    last_text: dict | None = None
    images_since_text = 0

    def following_text(start: int) -> dict | None:
        for item in flow[start + 1 :]:
            if item["kind"] == "text":
                return item
        return None

    for index, item in enumerate(flow):
        if item["kind"] == "text":
            text_counts[item["page"]] = text_counts.get(item["page"], 0) + 1
            record_id = f"p{item['page']:02d}-t{text_counts[item['page']]:02d}"
            records.append(
                {
                    "id": record_id,
                    "type": "text",
                    "page": item["page"],
                    "role": item["role"],
                    "font_size": item["font_size"],
                    "bbox": item["bbox"],
                    "text": item["text"],
                }
            )
            last_text = records[-1]
            images_since_text = 0
            continue

        image_counts[item["page"]] = image_counts.get(item["page"], 0) + 1
        record_id = f"p{item['page']:02d}-i{image_counts[item['page']]:02d}"
        filename = f"{record_id}.png"
        width, height = save_figure(doc, item["page_obj"], item["info"], IMAGE_DIR / filename)
        images_since_text += 1
        nxt = following_text(index)
        preceding = last_text["text"] if last_text else ""
        following = nxt["text"] if nxt else ""
        records.append(
            {
                "id": record_id,
                "type": "image",
                "page": item["page"],
                "role": "cover" if item["page"] == 1 else "figure",
                "file": f"images/{filename}",
                "width": width,
                "height": height,
                "bbox": item["bbox"],
                "anchor": {
                    "last_word": edge_word(preceding, last=True),
                    "last_line": edge_line(preceding, last=True),
                    "text_id": last_text["id"] if last_text else None,
                    "page": last_text["page"] if last_text else None,
                    "next_word": edge_word(following, last=False),
                    "next_line": edge_line(following, last=False),
                    "next_text_id": None,
                    "next_page": nxt["page"] if nxt else None,
                    "order_after_word": images_since_text,
                },
            }
        )

    for flow_i, record in enumerate(records):
        if record["type"] != "image":
            continue
        nxt_id = None
        for later in range(flow_i + 1, len(records)):
            if records[later]["type"] == "text":
                nxt_id = records[later]["id"]
                break
        record["anchor"]["next_text_id"] = nxt_id

    return records


def main() -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF_PATH)
    flow, chrome = collect(doc)
    records = build_records(doc, flow)

    jsonl_path = OUT_DIR / "content.jsonl"
    with jsonl_path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")

    figures = [r for r in records if r["type"] == "image"]
    texts = [r for r in records if r["type"] == "text"]
    manifest = {
        "source": PDF_PATH.name,
        "pages": doc.page_count,
        "format": "jsonl",
        "content": "content.jsonl",
        "text_blocks": len(texts),
        "figures": len(figures),
        "words": sum(len(WORD_RE.findall(r["text"])) for r in texts),
        "chrome": chrome,
        "anchor_rule": (
            "anchor.last_word is the last word of the text block immediately "
            "before the image in reading order. A figure at the top of a page "
            "is anchored to the last line of the previous page. "
            "order_after_word counts images stacked before the next paragraph."
        ),
        "figure_index": [
            {
                "id": fig["id"],
                "page": fig["page"],
                "file": fig["file"],
                "width": fig["width"],
                "height": fig["height"],
                "last_word": fig["anchor"]["last_word"],
                "last_line": fig["anchor"]["last_line"],
                "anchor_page": fig["anchor"]["page"],
                "anchor_text_id": fig["anchor"]["text_id"],
                "next_word": fig["anchor"]["next_word"],
                "order_after_word": fig["anchor"]["order_after_word"],
            }
            for fig in figures
        ],
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"text_blocks={len(texts)} figures={len(figures)} words={manifest['words']}")
    print(f"jsonl_bytes={jsonl_path.stat().st_size}")
    for fig in figures:
        anchor = fig["anchor"]
        print(
            f"{fig['id']} p{fig['page']} after p{anchor['page']} "
            f"«{anchor['last_word']}» / next «{anchor['next_word']}» "
            f"#{anchor['order_after_word']}"
        )


if __name__ == "__main__":
    main()
