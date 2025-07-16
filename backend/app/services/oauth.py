import secrets
from typing import Optional, Dict, Any
from urllib.parse import urlencode
import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class OAuthService:
    def __init__(self):
        self.google_client_id = settings.GOOGLE_CLIENT_ID
        self.google_client_secret = settings.GOOGLE_CLIENT_SECRET
        self.github_client_id = settings.GITHUB_CLIENT_ID
        self.github_client_secret = settings.GITHUB_CLIENT_SECRET
        
    def get_google_auth_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL"""
        if not self.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth not configured"
            )
        
        params = {
            "client_id": self.google_client_id,
            "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
            "scope": "openid email profile",
            "response_type": "code",
            "state": state,
        }
        
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    def get_github_auth_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL"""
        if not self.github_client_id:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="GitHub OAuth not configured"
            )
        
        params = {
            "client_id": self.github_client_id,
            "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/github/callback",
            "scope": "user:email",
            "state": state,
        }
        
        return f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    
    async def exchange_google_code(self, code: str) -> Dict[str, Any]:
        """Exchange Google authorization code for user info"""
        if not self.google_client_id or not self.google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth not configured"
            )
        
        # Exchange code for access token
        token_data = {
            "client_id": self.google_client_id,
            "client_secret": self.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            # Get user info
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user information"
                )
            
            user_info = user_response.json()
            
            return {
                "id": user_info.get("id"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "verified_email": user_info.get("verified_email", False),
            }
    
    async def exchange_github_code(self, code: str) -> Dict[str, Any]:
        """Exchange GitHub authorization code for user info"""
        if not self.github_client_id or not self.github_client_secret:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="GitHub OAuth not configured"
            )
        
        # Exchange code for access token
        token_data = {
            "client_id": self.github_client_id,
            "client_secret": self.github_client_secret,
            "code": code,
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data=token_data,
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            # Get user info
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"token {access_token}"}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user information"
                )
            
            user_info = user_response.json()
            
            # Get user email (might be private)
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {access_token}"}
            )
            
            primary_email = None
            if email_response.status_code == 200:
                emails = email_response.json()
                for email_info in emails:
                    if email_info.get("primary"):
                        primary_email = email_info.get("email")
                        break
            
            return {
                "id": str(user_info.get("id")),
                "username": user_info.get("login"),
                "email": primary_email or user_info.get("email"),
                "name": user_info.get("name"),
                "avatar_url": user_info.get("avatar_url"),
            }


# Global OAuth service instance
oauth_service = OAuthService()