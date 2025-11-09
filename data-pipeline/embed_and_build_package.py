#!/usr/bin/env python3
"""
embed_and_build_package.py
- scan sample_texts/<subject>/*.txt
- chunk text -> create embeddings (sentence-transformers)
- output segments.jsonl and manifest.json into model_packages/<subject>_v1/
"""
import os
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# CONFIG
EMB_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 300  # words
CHUNK_OVERLAP = 50
BASE_DIR = Path(__file__).resolve().parents[1]
TEXT_DIR = BASE_DIR / "data-pipeline" / "sample_texts"
OUT_DIR = BASE_DIR / "storage" / "model-packages"

model = SentenceTransformer(EMB_MODEL)

def chunk_text_words(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    words = text.split()
    if len(words) <= chunk_size:
        return [text]

    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i+chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks

def build_for_subject(subject_code):
    subject_text_dir = TEXT_DIR / subject_code
    if not subject_text_dir.exists():
        raise SystemExit(f"No text dir for {subject_code} at {subject_text_dir}")

    out_path = OUT_DIR / f"{subject_code}_v1"
    out_path.mkdir(parents=True, exist_ok=True)

    segments_out = out_path / f"{subject_code}_segments.jsonl"
    manifest = {"subject": subject_code, "segments": 0}
    seg_count = 0

    with segments_out.open("w", encoding="utf-8") as fh:
        for txt in sorted(subject_text_dir.glob("*.txt")):
            text = txt.read_text(encoding="utf-8")
            chunks = chunk_text_words(text)

            for i, c in enumerate(chunks):
                emb = model.encode(c).tolist()
                seg = {
                    "segment_id": f"{txt.stem}_seg{i}",
                    "text": c,
                    "embedding": emb,
                    "source": txt.name,
                    "offset": i
                }
                fh.write(json.dumps(seg, ensure_ascii=False) + "\n")
                seg_count += 1

    manifest["segments"] = seg_count
    manifest_path = out_path / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    print(f"✅ Built {seg_count} segments for {subject_code} -> {out_path}")

if __name__ == '__main__':
    # example: place text files in data_pipeline/sample_texts/CS101/*.txt etc.
    subjects = [d.name for d in TEXT_DIR.iterdir() if d.is_dir()]

    if not subjects:
        print("⚠️  No subjects found under data_pipeline/sample_texts/")
        print("   Create a folder per subject with txt files (e.g., CS101/, CS102/)")
        # Tạo sample structure
        sample_subject = TEXT_DIR / "CS101"
        sample_subject.mkdir(parents=True, exist_ok=True)
        sample_file = sample_subject / "lecture1.txt"
        sample_file.write_text("""CS101 - Introduction to Computer Science
Lecture 1: Programming Fundamentals

Programming là quá trình viết code để máy tính thực hiện các tác vụ.
Các khái niệm cơ bản:
- Variables: Biến lưu trữ dữ liệu
- Functions: Hàm để tái sử dụng code
- Control flow: if/else, loops để điều khiển luồng chương trình
- Data structures: Arrays, lists để tổ chức dữ liệu

Python là ngôn ngữ lập trình phổ biến cho người mới bắt đầu.
Cú pháp đơn giản, dễ đọc, phù hợp cho việc học lập trình.

Ví dụ về function:
def greet(name):
    return f"Hello, {name}!"

Ví dụ về loop:
for i in range(5):
    print(i)
""", encoding="utf-8")
        print(f"   ✅ Created sample: {sample_file}")
        subjects = ["CS101"]

    for s in subjects:
        try:
            build_for_subject(s)
        except Exception as e:
            print(f"❌ Error building {s}: {e}")
