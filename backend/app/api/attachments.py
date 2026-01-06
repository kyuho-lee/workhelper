from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path
import logging

from app.database import get_db
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import Attachment as AttachmentSchema
from app.core.security import get_current_user

# 로거 설정
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/attachments", tags=["Attachments"])

# 파일 저장 경로 설정
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 허용된 파일 확장자
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    'other': ['.zip']
}

# 최대 파일 크기 (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

def get_content_type(filename: str) -> str:
    """파일 확장자에 따른 정확한 Content-Type 반환"""
    ext = os.path.splitext(filename)[1].lower()
    
    content_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.zip': 'application/zip'
    }
    
    return content_types.get(ext, 'application/octet-stream')

def is_allowed_file(filename: str) -> bool:
    """허용된 파일 확장자인지 확인"""
    ext = os.path.splitext(filename)[1].lower()
    for extensions in ALLOWED_EXTENSIONS.values():
        if ext in extensions:
            return True
    return False

@router.post("", response_model=AttachmentSchema)
async def upload_file(
    entity_type: str,
    entity_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """파일 업로드"""
    
    # 파일 크기 확인
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB를 초과할 수 없습니다.")
    
    # 파일 확장자 확인
    if not is_allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식입니다.")
    
    # 고유한 파일명 생성 (UUID + 원본 확장자)
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # 파일 저장
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 저장 실패: {str(e)}")
    
    # 데이터베이스에 기록
    db_attachment = Attachment(
        entity_type=entity_type,
        entity_id=entity_id,
        filename=file.filename,
        filepath=str(file_path),
        filesize=file_size,
        content_type=get_content_type(file.filename),
        uploaded_by=current_user.username
    )
    
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    
    return db_attachment


@router.get("/download/{attachment_id}")
def download_file(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """파일 다운로드"""
    
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="첨부파일을 찾을 수 없습니다.")
    
    # 절대 경로로 변환
    file_path = Path(attachment.filepath)
    if not file_path.is_absolute():
        file_path = Path.cwd() / file_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="파일이 존재하지 않습니다.")
    
    # 파일을 바이너리로 읽기
    with open(file_path, "rb") as f:
        file_data = f.read()
    
    # 단순하게 파일 데이터만 반환 (프론트엔드에서 파일명 처리)
    return Response(
        content=file_data,
        media_type=attachment.content_type
    )

@router.get("/{entity_type}/{entity_id}", response_model=List[AttachmentSchema])
def get_attachments(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db)
):
    """특정 자산 또는 장애의 첨부파일 목록 조회"""
    attachments = db.query(Attachment).filter(
        Attachment.entity_type == entity_type,
        Attachment.entity_id == entity_id
    ).all()
    
    return attachments


@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """첨부파일 삭제"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="첨부파일을 찾을 수 없습니다.")
    
    # 권한 체크 (관리자 또는 업로드한 본인만)
    if current_user.role != "admin" and attachment.uploaded_by != current_user.username:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    # 실제 파일 삭제
    file_path = Path(attachment.filepath)
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception as e:
            logger.error(f"파일 삭제 실패: {e}")
    
    # 데이터베이스에서 삭제
    db.delete(attachment)
    db.commit()
    
    return {"message": "첨부파일이 삭제되었습니다."}