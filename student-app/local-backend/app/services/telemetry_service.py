"""
Telemetry Service - Local Backend
Gửi telemetry data đến remote API (background, optional)
"""
import requests
import json
from typing import Dict, Optional
from datetime import datetime
from app.config import settings


class TelemetryService:
    """Service để gửi telemetry đến remote API"""

    def __init__(self):
        self.enabled = settings.TELEMETRY_ENABLED
        self.remote_api_url = settings.REMOTE_API_URL
        self.timeout = settings.REMOTE_API_TIMEOUT
        self.batch = []
        self.batch_size = settings.TELEMETRY_BATCH_SIZE

    def send_event(
        self,
        event_type: str,
        data: Dict,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Gửi telemetry event

        Returns:
            True nếu thành công, False nếu không
        """
        if not self.enabled:
            return False

        event = {
            "event_type": event_type,
            "data": data,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Add to batch
        self.batch.append(event)

        # Send batch if full
        if len(self.batch) >= self.batch_size:
            return self._send_batch()

        return True

    def _send_batch(self) -> bool:
        """Gửi batch telemetry events"""
        if not self.batch:
            return True

        try:
            response = requests.post(
                f"{self.remote_api_url}/api/v1/telemetry/batch",
                json={"events": self.batch},
                timeout=self.timeout
            )

            if response.status_code == 200:
                self.batch = []
                return True
            else:
                # Keep batch for retry
                return False
        except Exception as e:
            print(f"⚠️  Telemetry send failed: {e}")
            # Keep batch for retry
            return False

    def flush(self):
        """Force send remaining batch"""
        if self.batch:
            self._send_batch()


# Global instance
telemetry_service = TelemetryService()

