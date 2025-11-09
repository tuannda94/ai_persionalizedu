"""
Cache Service - Local Backend
Caching cho RAG queries để tăng performance
"""
from typing import Optional, Tuple
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from app.config import settings

# In-memory cache
_cache = {}
_cache_ttl = 3600  # 1 hour
_cache_max_size = 1000  # Max cache entries

# File-based cache (persistent)
_cache_dir = Path(settings.STORAGE_DIR) / "cache"
_cache_dir.mkdir(parents=True, exist_ok=True)


def _get_cache_key(question: str, subject: Optional[str] = None) -> str:
    """Generate cache key from question and subject"""
    key_data = f"{question.lower().strip()}:{subject or 'all'}"
    return hashlib.md5(key_data.encode()).hexdigest()


def get_cached_result(question: str, subject: Optional[str] = None) -> Optional[Tuple[str, str, int]]:
    """
    Get cached RAG result

    Returns:
        (prompt, detected_subject, used_segments) or None if not cached
    """
    cache_key = _get_cache_key(question, subject)

    # Check in-memory cache
    if cache_key in _cache:
        entry = _cache[cache_key]
        if datetime.now() - entry['timestamp'] < timedelta(seconds=_cache_ttl):
            return entry['result']
        else:
            # Expired, remove from cache
            del _cache[cache_key]

    # Check file-based cache
    cache_file = _cache_dir / f"{cache_key}.json"
    if cache_file.exists():
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                entry = json.load(f)
            cache_time = datetime.fromisoformat(entry['timestamp'])
            if datetime.now() - cache_time < timedelta(seconds=_cache_ttl):
                return tuple(entry['result'])
            else:
                # Expired, delete file
                cache_file.unlink()
        except Exception as e:
            print(f"⚠️  Error reading cache file: {e}")

    return None


def set_cached_result(
    question: str,
    subject: Optional[str],
    result: Tuple[str, str, int]
):
    """
    Cache RAG result
    """
    cache_key = _get_cache_key(question, subject)

    # Add to in-memory cache
    _cache[cache_key] = {
        'result': result,
        'timestamp': datetime.now()
    }

    # Limit cache size
    if len(_cache) > _cache_max_size:
        # Remove oldest entries
        sorted_entries = sorted(_cache.items(), key=lambda x: x[1]['timestamp'])
        for key, _ in sorted_entries[:len(_cache) - _cache_max_size]:
            del _cache[key]

    # Save to file-based cache
    cache_file = _cache_dir / f"{cache_key}.json"
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump({
                'result': list(result),
                'timestamp': datetime.now().isoformat()
            }, f)
    except Exception as e:
        print(f"⚠️  Error writing cache file: {e}")


def clear_cache():
    """Clear all cache"""
    global _cache
    _cache = {}

    # Clear file cache
    for cache_file in _cache_dir.glob("*.json"):
        try:
            cache_file.unlink()
        except Exception as e:
            print(f"⚠️  Error deleting cache file: {e}")


def get_cache_stats() -> dict:
    """Get cache statistics"""
    file_count = len(list(_cache_dir.glob("*.json")))
    return {
        'memory_entries': len(_cache),
        'file_entries': file_count,
        'total_entries': len(_cache) + file_count
    }

