import re
from fastapi import HTTPException

def validate_password(password: str) -> bool:
    """
    비밀번호 정책 검증:
    - 최소 8자
    - 대문자 1개 이상
    - 소문자 1개 이상
    - 숫자 1개 이상
    - 특수문자 1개 이상
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="비밀번호는 최소 8자 이상이어야 합니다."
        )
    
    if not re.search(r'[A-Z]', password):
        raise HTTPException(
            status_code=400,
            detail="비밀번호는 대문자를 1개 이상 포함해야 합니다."
        )
    
    if not re.search(r'[a-z]', password):
        raise HTTPException(
            status_code=400,
            detail="비밀번호는 소문자를 1개 이상 포함해야 합니다."
        )
    
    if not re.search(r'\d', password):
        raise HTTPException(
            status_code=400,
            detail="비밀번호는 숫자를 1개 이상 포함해야 합니다."
        )
    
    if not re.search(r'[@$!%*?&]', password):
        raise HTTPException(
            status_code=400,
            detail="비밀번호는 특수문자(@$!%*?&)를 1개 이상 포함해야 합니다."
        )
    
    return True