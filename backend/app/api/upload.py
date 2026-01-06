from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/asset-image/{asset_number}")
async def upload_asset_image(asset_number: str, file: UploadFile = File(...)):
    try:
        # 파일 확장자 확인
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")
        
        # 파일 저장
        file_path = UPLOAD_DIR / f"{asset_number}.jpg"
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"filename": file.filename, "asset_number": asset_number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/asset-image/{asset_number}")
async def get_asset_image(asset_number: str):
    file_path = UPLOAD_DIR / f"{asset_number}.jpg"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")
    return FileResponse(file_path)