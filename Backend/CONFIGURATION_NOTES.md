# Configuration Notes & Updates

## Recent Configuration Updates

### Email Service Configuration
The `.env.example` file has been updated with production email credentials:

**Email Server**: mail.studyproglobal.com.bd
- **SMTP Port**: 465 (SSL/TLS)
- **IMAP Port**: 993 (for receiving emails)
- **POP3 Port**: 995 (alternative to IMAP)
- **Email Account**: info@studyproglobal.com.bd

This configuration uses the domain's email server instead of third-party services like Gmail.

### $myxn Token Integration
The cryptocurrency payment integration has been configured:
- **Contract Address**: `CHXoAEvTi3FAEZMkWDJJmUSRXxYAoeco4bDMDZQJVWen`

### Storage & AI Chat Options

**File Storage**:
- **Option 1**: AWS S3 (cloud storage)
- **Option 2**: cPanel server file system (local storage)
- Set `FILE_STORAGE_MODE` to either `s3` or `cpanel`

**AI Chat**:
- **Option 1**: OpenAI API (enhanced responses)
- **Option 2**: Basic built-in responses (no API key needed)
- Set `AI_CHAT_MODE` to either `openai` or `basic`

## Future Integration Opportunities

### MSM Unify
Consider integrating with **MSM Unify** for enhanced university services:

- **Service Portal**: https://www.msmunify.com/service/
- **For Institutions**: https://www.msmunify.com/for-institutions/

MSM Unify provides:
- Additional university network connections
- Enhanced student services
- Institutional partnerships
- Application processing support

**Configuration Variables Added**:
```env
MSMUNIFY_API_KEY=your_msmunify_api_key_here
MSMUNIFY_API_URL=https://api.msmunify.com/v1
MSMUNIFY_ENABLED=false
```

To enable:
1. Sign up for MSM Unify services
2. Obtain API credentials
3. Update `.env` with API key
4. Set `MSMUNIFY_ENABLED=true`
5. Implement integration endpoints (future development)

## Configuration Best Practices

1. **Email Setup**:
   - Test email sending after configuration
   - Verify SMTP settings work with your email client
   - Check spam folder for test emails

2. **Payment Gateway**:
   - Test $myxn token transactions in sandbox mode first
   - Verify contract address on blockchain explorer
   - Set up webhook handlers for payment confirmations

3. **Storage**:
   - For production with high traffic, use AWS S3
   - For small-scale deployment, cPanel storage is sufficient
   - Ensure proper file permissions for uploads directory

4. **AI Chat**:
   - Start with basic mode to test functionality
   - Upgrade to OpenAI for better responses
   - Monitor API usage and costs with OpenAI

## Environment Variables Checklist

Essential (must configure):
- [x] Database credentials (pre-configured)
- [x] JWT secrets (pre-configured)
- [x] Email SMTP settings (pre-configured)
- [x] $myxn token contract address (pre-configured)
- [x] CORS origin (pre-configured)

Optional (enhance features):
- [ ] Stripe API keys (for credit card payments)
- [ ] OpenAI API key (for enhanced AI chat)
- [ ] AWS S3 credentials (for cloud file storage)
- [ ] MSM Unify API key (for extended services)
- [ ] Google Analytics ID
- [ ] Facebook Pixel ID

## Testing Configuration

After updating `.env`:

1. **Test Email**:
   ```bash
   # Send test email through API
   curl -X POST http://localhost:3000/api/v1/test/email \
     -H "Authorization: Bearer <token>"
   ```

2. **Test Payment**:
   ```bash
   # Verify $myxn contract address
   # Check blockchain explorer for contract details
   ```

3. **Test AI Chat**:
   ```bash
   # Test chat endpoint
   curl -X POST http://localhost:3000/api/v1/chat/message \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

## Support

For configuration questions:
- Email: admin@studyproglobal.com.bd
- Review: `.env.example` for all available options
- Documentation: See PRODUCTION_SETUP.md

---

**Last Updated**: November 24, 2025
**Status**: Production Ready with Enhanced Configuration
