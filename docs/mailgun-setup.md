# Mailgun Email Setup

ImgLink uses Mailgun for sending transactional emails. This guide will help you set up Mailgun for your ImgLink instance.

## Why Mailgun?

- **Cost-effective**: 1,000 emails/month free, then $0.80 per 1,000 emails
- **Reliable**: High deliverability rates and detailed analytics
- **Simple API**: Easy integration with REST API
- **EU/US regions**: Choose where your email data is processed

## Setting Up Mailgun

### 1. Create a Mailgun Account

1. Go to [Mailgun.com](https://www.mailgun.com) and sign up
2. Choose your region (US or EU) during signup
3. Verify your email address

### 2. Add and Verify Your Domain

1. In the Mailgun dashboard, go to **Sending** → **Domains**
2. Click **Add New Domain**
3. Enter a subdomain like `mg.yourdomain.com` (recommended) or use your main domain
4. Follow the DNS verification steps:
   - Add the provided TXT records to your DNS
   - Add the provided MX records if you want to receive emails
   - Add CNAME records for tracking (optional)
5. Wait for DNS propagation (usually 24-48 hours)
6. Click **Verify DNS Settings** in Mailgun

### 3. Get Your API Credentials

1. Go to **Settings** → **API Keys**
2. Copy your **Private API Key** (starts with `key-`)
3. Note your domain name from the Domains page

### 4. Configure ImgLink

Update your `.env` file with your Mailgun credentials:

```env
# Mailgun Configuration
MAILGUN_API_KEY=key-your-actual-api-key-here
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@mg.yourdomain.com
MAILGUN_FROM_NAME=ImgLink
```

### 5. Test Your Configuration

After restarting the backend, test email sending by:
1. Creating a new account
2. Requesting a password reset
3. Check Mailgun dashboard for sent emails

## Email Templates

ImgLink sends the following emails:
- **Email Verification**: Sent when a new user registers
- **Password Reset**: Sent when a user requests to reset their password
- **Welcome Email**: Sent after successful email verification

## Troubleshooting

### Emails Not Sending

1. Check your Mailgun API key is correct
2. Verify your domain is verified in Mailgun
3. Check the backend logs: `docker logs imglink-backend`
4. Ensure your Mailgun account is not in sandbox mode

### Domain Verification Issues

1. Use a subdomain (mg.yourdomain.com) instead of your main domain
2. Wait 24-48 hours for DNS propagation
3. Use Mailgun's DNS checker tool

### Sandbox Mode

New Mailgun accounts start in sandbox mode:
- Can only send to verified email addresses
- Add recipients in **Sending** → **Authorized Recipients**
- Upgrade your account to send to any email address

## Production Best Practices

1. **Use a subdomain**: Prevents conflicts with your main domain's email
2. **Enable tracking**: Add CNAME records for open/click tracking
3. **Set up webhooks**: Monitor bounces and complaints
4. **Configure SPF/DKIM**: Improves deliverability
5. **Monitor your reputation**: Check Mailgun's analytics regularly

## Cost Optimization

- First 1,000 emails/month are free
- Flex plan: Pay-as-you-go at $0.80 per 1,000 emails
- Foundation plan: $35/month for 50,000 emails
- Monitor usage in the Mailgun dashboard

## API Reference

The email service implementation can be found at:
`backend/app/services/email.py`

Example usage:
```python
from app.services.email import email_service

# Send verification email
email_service.send_verification_email(
    email="user@example.com",
    username="john_doe",
    token="verification-token"
)
```