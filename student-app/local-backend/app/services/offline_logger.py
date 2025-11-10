"""
Offline Logger Service - Local Backend
Lưu logs khi offline và gửi lên server khi có mạng
"""
import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import requests
from app.config import settings

# Database path for offline logs
LOG_DB_PATH = Path(settings.STORAGE_DIR) / "databases" / "offline_logs.db"
LOG_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Initialize database
def init_log_db():
    """Initialize offline logs database"""
    conn = sqlite3.connect(str(LOG_DB_PATH))
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS offline_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_type TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            sync_attempts INTEGER DEFAULT 0
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_synced ON offline_logs(synced, created_at)
    """)
    conn.commit()
    conn.close()

# Initialize on import
init_log_db()


class OfflineLogger:
    """Service to log events offline and sync when online"""

    def __init__(self):
        self.remote_api_url = getattr(settings, 'REMOTE_API_URL', '')
        self.sync_enabled = getattr(settings, 'TELEMETRY_ENABLED', True)

    def log(self, log_type: str, data: Dict) -> bool:
        """
        Log an event (saves to local DB)

        Args:
            log_type: Type of log (e.g., 'chat', 'error', 'usage', 'feedback')
            data: Dictionary of log data

        Returns:
            bool: True if logged successfully
        """
        try:
            conn = sqlite3.connect(str(LOG_DB_PATH))
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO offline_logs (log_type, data, created_at, synced, sync_attempts)
                VALUES (?, ?, ?, 0, 0)
            """, (
                log_type,
                json.dumps(data),
                datetime.utcnow().isoformat()
            ))

            conn.commit()
            conn.close()

            # Try to sync immediately if online
            self.sync_logs()

            return True
        except Exception as e:
            print(f"❌ Error logging offline: {e}")
            return False

    def sync_logs(self, max_attempts: int = 10) -> int:
        """
        Sync offline logs to remote API

        Args:
            max_attempts: Maximum number of logs to sync in one batch

        Returns:
            int: Number of logs synced
        """
        if not self.sync_enabled or not self.remote_api_url:
            return 0

        if not self._is_online():
            return 0

        try:
            conn = sqlite3.connect(str(LOG_DB_PATH))
            cursor = conn.cursor()

            # Get unsynced logs
            cursor.execute("""
                SELECT id, log_type, data, created_at, sync_attempts
                FROM offline_logs
                WHERE synced = 0
                ORDER BY created_at ASC
                LIMIT ?
            """, (max_attempts,))

            logs = cursor.fetchall()

            if not logs:
                conn.close()
                return 0

            synced_count = 0

            for log_id, log_type, data_str, created_at, sync_attempts in logs:
                try:
                    data = json.loads(data_str)

                    # Send to remote API based on log type
                    success = self._send_log(log_type, data)

                    if success:
                        # Mark as synced
                        cursor.execute("""
                            UPDATE offline_logs
                            SET synced = 1
                            WHERE id = ?
                        """, (log_id,))
                        synced_count += 1
                    else:
                        # Increment sync attempts
                        cursor.execute("""
                            UPDATE offline_logs
                            SET sync_attempts = sync_attempts + 1
                            WHERE id = ?
                        """, (log_id,))

                        # If too many attempts, mark as failed (but keep for manual review)
                        if sync_attempts >= 5:
                            print(f"⚠️  Log {log_id} failed to sync after {sync_attempts} attempts")

                except Exception as e:
                    print(f"❌ Error syncing log {log_id}: {e}")
                    cursor.execute("""
                        UPDATE offline_logs
                        SET sync_attempts = sync_attempts + 1
                        WHERE id = ?
                    """, (log_id,))

            conn.commit()
            conn.close()

            if synced_count > 0:
                print(f"✅ Synced {synced_count} offline logs to server")

            return synced_count

        except Exception as e:
            print(f"❌ Error syncing offline logs: {e}")
            return 0

    def _send_log(self, log_type: str, data: Dict) -> bool:
        """Send log to remote API"""
        try:
            # Get auth token if available
            token = self._get_auth_token()
            headers = {
                'Content-Type': 'application/json'
            }
            if token:
                headers['Authorization'] = f'Bearer {token}'

            # Map log types to API endpoints
            endpoint_map = {
                'telemetry': '/api/v1/telemetry',
                'feedback': '/api/v1/feedback',
                'chat': '/api/v1/telemetry',  # Chat usage as telemetry
                'error': '/api/v1/telemetry',  # Errors as telemetry
                'usage': '/api/v1/telemetry'
            }

            endpoint = endpoint_map.get(log_type, '/api/v1/telemetry')
            url = f"{self.remote_api_url}{endpoint}"

            # Prepare payload
            payload = {
                'log_type': log_type,
                'data': data,
                'timestamp': data.get('timestamp', datetime.utcnow().isoformat())
            }

            response = requests.post(url, json=payload, headers=headers, timeout=5)
            response.raise_for_status()

            return True

        except Exception as e:
            print(f"❌ Error sending log to server: {e}")
            return False

    def _is_online(self) -> bool:
        """Check if online (simple check)"""
        try:
            # Try to reach remote API
            response = requests.get(
                f"{self.remote_api_url}/health",
                timeout=2
            )
            return response.status_code == 200
        except:
            return False

    def _get_auth_token(self) -> Optional[str]:
        """Get auth token from local storage (if available)"""
        # This would need to be implemented based on how tokens are stored
        # For now, return None (optional auth)
        return None

    def get_pending_logs_count(self) -> int:
        """Get count of unsynced logs"""
        try:
            conn = sqlite3.connect(str(LOG_DB_PATH))
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM offline_logs WHERE synced = 0")
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except:
            return 0


# Singleton instance
_offline_logger_instance = None

def get_offline_logger() -> OfflineLogger:
    """Get singleton OfflineLogger instance"""
    global _offline_logger_instance
    if _offline_logger_instance is None:
        _offline_logger_instance = OfflineLogger()
    return _offline_logger_instance

