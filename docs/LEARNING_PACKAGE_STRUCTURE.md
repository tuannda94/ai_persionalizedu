# 📦 Cấu Trúc Learning Package

## Tổng Quan

Learning Package là một file ZIP chứa tất cả dữ liệu học liệu cần thiết cho một phiên bản của ứng dụng, bao gồm:
- Dữ liệu embedding (vector representations)
- RAG index (Chroma vector database)
- Config model
- Scripts local inference (nếu có)

## Cấu Trúc Thư Mục

```
learning-package-v1.2.3.zip
├── manifest.json                    # Metadata và mô tả package
├── embeddings/                      # Dữ liệu embedding
│   ├── embeddings.json              # JSON format embeddings
│   ├── embeddings.csv               # CSV format (alternative)
│   └── embeddings.bin               # Binary format (alternative)
├── rag_index/                       # Chroma vector database
│   ├── chroma.sqlite3               # Chroma database file
│   └── ...                          # Other Chroma files
├── config/                          # Configuration files
│   ├── model_config.json            # Model configuration
│   └── rag_config.json              # RAG configuration
└── scripts/                         # Optional inference scripts
    ├── inference.py                 # Local inference script
    └── requirements.txt             # Python dependencies
```

## manifest.json Format

```json
{
  "version": "1.2.3",
  "version_code": 10203,
  "created_at": "2024-11-12T10:00:00Z",
  "description": "Learning package for version 1.2.3",
  "contents": {
    "embeddings": {
      "format": "json",
      "path": "embeddings/embeddings.json",
      "count": 1000,
      "dimension": 384
    },
    "rag_index": {
      "type": "chroma",
      "path": "rag_index/",
      "collection_name": "poly_ai_documents"
    },
    "config": {
      "model_config": "config/model_config.json",
      "rag_config": "config/rag_config.json"
    },
    "scripts": {
      "inference": "scripts/inference.py",
      "requirements": "scripts/requirements.txt"
    }
  },
  "checksums": {
    "embeddings": "sha256:abc123...",
    "rag_index": "sha256:def456...",
    "config": "sha256:ghi789..."
  }
}
```

## Chi Tiết Các Thành Phần

### 1. Embeddings

Có thể ở một trong các format:
- **JSON**: `{"doc_id": [vector], ...}`
- **CSV**: `doc_id,embedding_0,embedding_1,...`
- **Binary**: Optimized binary format

### 2. RAG Index (Chroma)

Chroma vector database chứa:
- Document embeddings
- Metadata (subject, chapter, etc.)
- Collection configuration

### 3. Config Files

**model_config.json**:
```json
{
  "model_name": "all-MiniLM-L6-v2",
  "embedding_dimension": 384,
  "max_tokens": 512,
  "temperature": 0.7
}
```

**rag_config.json**:
```json
{
  "top_k": 5,
  "similarity_threshold": 0.7,
  "rerank": true
}
```

### 4. Scripts (Optional)

Nếu có thay đổi trong local inference logic, có thể include:
- `inference.py`: Updated inference script
- `requirements.txt`: New dependencies

## Quy Trình Tạo Package

1. **Chuẩn bị dữ liệu**:
   - Generate embeddings từ documents
   - Build Chroma index
   - Prepare config files

2. **Tạo manifest.json**:
   - Mô tả tất cả files trong package
   - Include checksums

3. **Đóng gói**:
   ```bash
   zip -r learning-package-v1.2.3.zip \
     manifest.json \
     embeddings/ \
     rag_index/ \
     config/ \
     scripts/
   ```

4. **Upload qua Admin Dashboard**:
   - Upload cùng với installer file
   - System sẽ tự động validate và lưu

## Quy Trình Cài Đặt (Student App)

1. **Download package** từ version update response
2. **Verify hash** để đảm bảo integrity
3. **Extract** vào `storage/learning-packages/v{version}/`
4. **Validate manifest** và checksums
5. **Update RAG engine** với dữ liệu mới
6. **Reload config** từ package

## Best Practices

1. **Versioning**: Mỗi package phải có version rõ ràng
2. **Incremental Updates**: Chỉ include files thay đổi (nếu có thể)
3. **Compression**: Sử dụng compression tốt để giảm size
4. **Validation**: Luôn validate manifest và checksums
5. **Rollback**: Giữ lại package cũ để có thể rollback

