from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.db.models import RefreshToken, User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    exists = db.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()

    refresh_value = create_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_value,
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )
    )
    db.commit()

    return TokenResponse(access_token=create_access_token(user.id), refresh_token=refresh_value)


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    refresh_value = create_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_value,
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )
    )
    db.commit()

    return TokenResponse(access_token=create_access_token(user.id), refresh_token=refresh_value)


@router.post('/refresh', response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    now = datetime.now(UTC)
    record = db.scalar(select(RefreshToken).where(RefreshToken.token == payload.refresh_token))
    if not record or record.revoked or record.expires_at < now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    record.revoked = True
    next_refresh = create_refresh_token()
    db.add(
        RefreshToken(
            user_id=record.user_id,
            token=next_refresh,
            expires_at=now + timedelta(days=7),
        )
    )
    db.commit()

    return TokenResponse(access_token=create_access_token(record.user_id), refresh_token=next_refresh)


@router.post('/logout')
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    record = db.scalar(select(RefreshToken).where(RefreshToken.token == payload.refresh_token))
    if record and not record.revoked:
        record.revoked = True
        db.commit()

    return {'message': 'logged out'}
