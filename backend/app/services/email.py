import requests
from typing import List, Optional
import logging

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.api_key = settings.MAILGUN_API_KEY
        self.domain = settings.MAILGUN_DOMAIN
        self.from_email = settings.MAILGUN_FROM_EMAIL
        self.from_name = settings.MAILGUN_FROM_NAME
        self.api_base = settings.MAILGUN_API_BASE
        logger.info(f"EmailService initialized with domain: {self.domain}, from: {self.from_email}")

    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send an email using Mailgun API"""
        if not all([self.api_key, self.domain, self.from_email]):
            logger.warning("Mailgun not configured. Skipping email send.")
            return False

        try:
            logger.info(f"Attempting to send email to {to_emails} with subject: {subject}")
            
            # Prepare the request data
            data = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": to_emails,
                "subject": subject,
                "html": html_content
            }
            
            # Add text content if provided
            if text_content:
                data["text"] = text_content

            # Send the email via Mailgun API
            url = f"{self.api_base}/{self.domain}/messages"
            logger.info(f"Sending request to Mailgun API: {url}")
            
            response = requests.post(
                url,
                auth=("api", self.api_key),
                data=data
            )

            if response.status_code == 200:
                logger.info(f"Email sent successfully to {to_emails} via Mailgun")
                return True
            else:
                logger.error(f"Mailgun API error: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {str(e)}")
            return False

    def send_verification_email(self, email: str, username: str, token: str) -> bool:
        """Send email verification email"""
        logger.info(f"send_verification_email called for {email}")
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        subject = "Verify your ImgLink account"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Verify your ImgLink account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1;">ImgLink</h1>
                </div>
                
                <h2>Welcome to ImgLink, {username}!</h2>
                
                <p>Thank you for signing up for ImgLink. To complete your registration and start sharing amazing images, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">{verification_url}</p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                    This verification link will expire in 24 hours. If you didn't create an account with ImgLink, please ignore this email.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    Best regards,<br>
                    The ImgLink Team
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to ImgLink, {username}!
        
        Thank you for signing up for ImgLink. To complete your registration and start sharing amazing images, please verify your email address by visiting:
        
        {verification_url}
        
        This verification link will expire in 24 hours. If you didn't create an account with ImgLink, please ignore this email.
        
        Best regards,
        The ImgLink Team
        """
        
        return self.send_email([email], subject, html_content, text_content)

    def send_password_reset_email(self, email: str, username: str, token: str) -> bool:
        """Send password reset email"""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        subject = "Reset your ImgLink password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset your ImgLink password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1;">ImgLink</h1>
                </div>
                
                <h2>Password Reset Request</h2>
                
                <p>Hello {username},</p>
                
                <p>We received a request to reset your password for your ImgLink account. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #dc2626;">{reset_url}</p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                    This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    Best regards,<br>
                    The ImgLink Team
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request
        
        Hello {username},
        
        We received a request to reset your password for your ImgLink account. Visit the following link to create a new password:
        
        {reset_url}
        
        This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        
        Best regards,
        The ImgLink Team
        """
        
        return self.send_email([email], subject, html_content, text_content)

    def send_welcome_email(self, email: str, username: str) -> bool:
        """Send welcome email after successful verification"""
        subject = "Welcome to ImgLink!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to ImgLink!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1;">ImgLink</h1>
                </div>
                
                <h2>Welcome to ImgLink, {username}! 🎉</h2>
                
                <p>Your email has been verified and your account is now active. You're all set to start sharing amazing images with the world!</p>
                
                <h3>What you can do now:</h3>
                <ul>
                    <li><strong>Upload images:</strong> Share your photos with the community</li>
                    <li><strong>Create albums:</strong> Organize your images into collections</li>
                    <li><strong>Discover content:</strong> Browse and like images from other users</li>
                    <li><strong>Engage:</strong> Comment on images and connect with creators</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/upload" 
                       style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Upload Your First Image
                    </a>
                </div>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                    If you have any questions or need help getting started, feel free to reach out to our support team.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    Happy sharing!<br>
                    The ImgLink Team
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to ImgLink, {username}!
        
        Your email has been verified and your account is now active. You're all set to start sharing amazing images with the world!
        
        What you can do now:
        - Upload images: Share your photos with the community
        - Create albums: Organize your images into collections
        - Discover content: Browse and like images from other users
        - Engage: Comment on images and connect with creators
        
        Visit {settings.FRONTEND_URL}/upload to upload your first image!
        
        Happy sharing!
        The ImgLink Team
        """
        
        return self.send_email([email], subject, html_content, text_content)


# Global email service instance
email_service = EmailService()