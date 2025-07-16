from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, verify_password, get_password_hash, decode_token
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema
from app.services.email import email_service
from app.services.oauth import oauth_service

router = APIRouter()


class EmailVerificationRequest(BaseModel):
    token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class OAuthURLResponse(BaseModel):
    auth_url: str
    state: str


@router.post("/register", response_model=UserSchema)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
) -> Any:
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this username already exists.",
        )
    
    # Create new user (not verified by default)
    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        bio=user_in.bio,
        avatar_url=user_in.avatar_url,
        is_verified=False,  # Require email verification
    )
    
    # Generate verification token
    verification_token = user.generate_email_verification_token()
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email in background
    import logging
    logging.info(f"Adding email task for user {user.email}")
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        user.username,
        verification_token
    )
    
    return user


@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    # Try to authenticate with username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    
    if not user.is_verified:
        raise HTTPException(
            status_code=400, 
            detail="Email not verified. Please check your email for verification instructions."
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    *,
    db: Session = Depends(get_db),
    refresh_token: str,
) -> Any:
    try:
        payload = decode_token(refresh_token)
        username: str = payload.get("sub")
        token_type = payload.get("type")
        
        if not username or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user.username})
    new_refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/verify-email")
def verify_email(
    *,
    db: Session = Depends(get_db),
    request: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
) -> Any:
    """Verify user's email address"""
    user = db.query(User).filter(
        User.email_verification_token == request.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Invalid verification token"
        )
    
    if not user.is_email_verification_token_valid(request.token):
        raise HTTPException(
            status_code=400,
            detail="Verification token has expired. Please request a new one."
        )
    
    # Check if user is already verified to prevent duplicate welcome emails
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Verify the user atomically
    user.clear_email_verification_token()
    db.commit()
    
    # Double-check after commit to ensure verification succeeded
    db.refresh(user)
    if user.is_verified:
        # Send welcome email in background (only once after successful verification)
        background_tasks.add_task(
            email_service.send_welcome_email,
            user.email,
            user.username
        )
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification_email(
    *,
    db: Session = Depends(get_db),
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
) -> Any:
    """Resend email verification email"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, verification instructions have been sent"}
    
    if user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Email is already verified"
        )
    
    # Generate new verification token
    verification_token = user.generate_email_verification_token()
    db.commit()
    
    # Send verification email in background
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        user.username,
        verification_token
    )
    
    return {"message": "Verification email sent"}


@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(get_db),
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
) -> Any:
    """Request password reset"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, password reset instructions have been sent"}
    
    if not user.is_active:
        return {"message": "If the email exists, password reset instructions have been sent"}
    
    # Generate password reset token
    reset_token = user.generate_password_reset_token()
    db.commit()
    
    # Send password reset email in background
    background_tasks.add_task(
        email_service.send_password_reset_email,
        user.email,
        user.username,
        reset_token
    )
    
    return {"message": "Password reset instructions sent"}


@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(get_db),
    request: PasswordResetConfirm,
) -> Any:
    """Reset password with token"""
    user = db.query(User).filter(
        User.password_reset_token == request.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Invalid reset token"
        )
    
    if not user.is_password_reset_token_valid(request.token):
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.clear_password_reset_token()
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.get("/google", response_model=OAuthURLResponse)
def google_auth_url() -> Any:
    """Get Google OAuth authorization URL"""
    import secrets
    state = secrets.token_urlsafe(32)
    auth_url = oauth_service.get_google_auth_url(state)
    
    return {
        "auth_url": auth_url,
        "state": state
    }


@router.get("/github", response_model=OAuthURLResponse)
def github_auth_url() -> Any:
    """Get GitHub OAuth authorization URL"""
    import secrets
    state = secrets.token_urlsafe(32)
    auth_url = oauth_service.get_github_auth_url(state)
    
    return {
        "auth_url": auth_url,
        "state": state
    }


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
) -> Any:
    """Handle Google OAuth callback"""
    try:
        # Exchange code for user info
        user_info = await oauth_service.exchange_google_code(code)
        
        # Check if user exists
        existing_user = db.query(User).filter(
            (User.google_id == user_info["id"]) | (User.email == user_info["email"])
        ).first()
        
        if existing_user:
            # Link Google account if not already linked
            if not existing_user.google_id:
                existing_user.google_id = user_info["id"]
                db.commit()
            
            # Verify email if it comes from Google as verified
            if user_info.get("verified_email") and not existing_user.is_verified:
                existing_user.is_verified = True
                db.commit()
            
            user = existing_user
        else:
            # Create new user
            username = user_info.get("email", "").split("@")[0]
            # Ensure username is unique
            counter = 1
            original_username = username
            while db.query(User).filter(User.username == username).first():
                username = f"{original_username}_{counter}"
                counter += 1
            
            user = User(
                username=username,
                email=user_info["email"],
                full_name=user_info.get("name"),
                avatar_url=user_info.get("picture"),
                google_id=user_info["id"],
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # Random password
                is_verified=user_info.get("verified_email", False),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create tokens
        access_token = create_access_token(data={"sub": user.username})
        refresh_token = create_refresh_token(data={"sub": user.username})
        
        # Redirect to frontend with tokens
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        # Redirect to frontend with error
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?error=oauth_failed"
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)


@router.get("/github/callback")
async def github_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
) -> Any:
    """Handle GitHub OAuth callback"""
    try:
        # Exchange code for user info
        user_info = await oauth_service.exchange_github_code(code)
        
        if not user_info.get("email"):
            # Redirect to frontend with error
            redirect_url = f"{settings.FRONTEND_URL}/auth/callback?error=no_email"
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=redirect_url)
        
        # Check if user exists
        existing_user = db.query(User).filter(
            (User.github_id == user_info["id"]) | (User.email == user_info["email"])
        ).first()
        
        if existing_user:
            # Link GitHub account if not already linked
            if not existing_user.github_id:
                existing_user.github_id = user_info["id"]
                db.commit()
            
            user = existing_user
        else:
            # Create new user
            username = user_info.get("username", user_info.get("email", "").split("@")[0])
            # Ensure username is unique
            counter = 1
            original_username = username
            while db.query(User).filter(User.username == username).first():
                username = f"{original_username}_{counter}"
                counter += 1
            
            user = User(
                username=username,
                email=user_info["email"],
                full_name=user_info.get("name"),
                avatar_url=user_info.get("avatar_url"),
                github_id=user_info["id"],
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # Random password
                is_verified=True,  # GitHub emails are considered verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create tokens
        access_token = create_access_token(data={"sub": user.username})
        refresh_token = create_refresh_token(data={"sub": user.username})
        
        # Redirect to frontend with tokens
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        # Redirect to frontend with error
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?error=oauth_failed"
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)