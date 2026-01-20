import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# n8n Webhook URL
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/9ca5199d-7310-4ed6-a005-cf9bf0348209"

# 프론트엔드 URL (카카오톡 링크용)
FRONTEND_URL = "http://localhost:3000"

async def send_kakao_notification(
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None
):
    """
    n8n Webhook을 통해 카카오톡 알림 전송
    
    Args:
        notification_type: 알림 유형 (Issue, Asset, Inspection 등)
        title: 알림 제목
        message: 알림 내용
        link: 클릭 시 이동할 URL (선택)
    """
    payload = {
        "type": notification_type,
        "title": title,
        "message": message,
        "link": link or FRONTEND_URL
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                N8N_WEBHOOK_URL,
                json=payload,
                timeout=10.0
            )
            logger.info(f"Kakao notification sent: {response.status_code}")
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Kakao notification error: {e}")
        return False