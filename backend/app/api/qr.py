from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import qrcode
from io import BytesIO

router = APIRouter(prefix="/api/qr", tags=["QR Code"])

@router.get("/generate/{asset_number}")
def generate_qr_code(asset_number: str):
    try:
        # QR 코드 생성
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # 자산 정보 URL 또는 데이터
        data = f"ASSET:{asset_number}"
        qr.add_data(data)
        qr.make(fit=True)
        
        # 이미지 생성
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 이미지를 바이트로 변환
        img_io = BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        # Content-Disposition 헤더 추가
        return StreamingResponse(
            img_io, 
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=QR_{asset_number}.png"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))