"""
Ollama Service - Local Backend
Client để gọi Ollama API (local)
"""
import requests
import json
from typing import Iterator, Optional
from app.config import settings


def stream_response(prompt: str) -> Iterator[dict]:
    """
    Stream response từ Ollama

    Yields:
        dict với keys: 'token', 'done', 'error'
    """
    ollama_url = settings.OLLAMA_URL
    ollama_model = settings.OLLAMA_MODEL

    # Build system message để đảm bảo trả lời bằng tiếng Việt
    system_message = "Bạn là trợ lý học tập AI. Luôn trả lời BẰNG TIẾNG VIỆT. Không được trả lời bằng tiếng Anh."

    payload = {
        "model": ollama_model,
        "prompt": prompt,
        "system": system_message,  # Thêm system message
        "stream": True,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9
        }
    }

    try:
        with requests.post(ollama_url, json=payload, stream=True, timeout=300) as r:
            r.raise_for_status()

            for line in r.iter_lines():
                if line:
                    try:
                        chunk_data = json.loads(line.decode('utf-8'))
                        # Ollama có thể trả về 'response' hoặc 'text' field
                        token = chunk_data.get('response', '') or chunk_data.get('text', '')

                        if token:
                            yield {
                                'token': token,
                                'done': False
                            }

                        if chunk_data.get('done', False):
                            yield {
                                'done': True
                            }
                            break
                    except json.JSONDecodeError:
                        continue
                    except Exception as e:
                        yield {
                            'error': f"Error processing chunk: {str(e)}"
                        }
                        continue
    except Exception as e:
        yield {
            'error': f"Ollama streaming error: {str(e)}"
        }
