from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
import segno

router = APIRouter(prefix="/api/qr", tags=["QR Code"])

@router.get("/generate/{asset_number}")
def generate_qr_code(asset_number: str):
    """세련된 QR 코드 생성 (이미지 표시용)"""
    try:
        data = f"ASSET:{asset_number}"
        
        # QR 코드 생성
        qr = segno.make(data, error='h', micro=False)
        
        # 버퍼에 저장 (고품질)
        img_io = BytesIO()
        qr.save(
            img_io,
            kind='png',
            scale=10,           # 큰 사이즈
            border=2,           # 슬림 테두리
            dark='#000000',     # 파란색
            light='white',      # 흰색 배경
        )
        img_io.seek(0)
        
        return StreamingResponse(
            img_io,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=QR_{asset_number}.png",
                "Cache-Control": "public, max-age=86400"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{asset_number}")
def download_qr_code(asset_number: str):
    """QR 코드 다운로드용"""
    try:
        data = f"ASSET:{asset_number}"
        qr = segno.make(data, error='h')
        
        img_io = BytesIO()
        qr.save(
            img_io,
            kind='png',
            scale=10,
            border=2,
            dark='#000000',
            light='white'
        )
        img_io.seek(0)
        
        return StreamingResponse(
            img_io,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=QR_{asset_number}.png"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))