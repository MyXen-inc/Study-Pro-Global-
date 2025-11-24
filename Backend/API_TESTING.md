# API Testing Guide

This guide provides examples of how to test the Study Pro Global API endpoints.

## Base URL

- Development: `http://localhost:3000/api/v1`
- Production: `https://www.studyproglobal.com.bd/api/v1`

## Health Check

```bash
curl http://localhost:3000/api/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Study Pro Global API is running",
  "timestamp": "2025-11-24T...",
  "environment": "development"
}
```

## Authentication Endpoints

### 1. Register New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "country": "USA",
    "academicLevel": "bachelor"
  }'
```

Expected Response (201):
```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "country": "USA",
      "academicLevel": "bachelor",
      "subscriptionType": "free",
      "profileComplete": 57
    }
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

Expected Response (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      ...
    }
  }
}
```

**Save the token for subsequent requests:**
```bash
export TOKEN="your_token_here"
```

### 3. Get Current User

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## User Profile Endpoints

### 5. Get Profile

```bash
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Update Profile

```bash
curl -X PUT http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "address": "New York, USA",
    "dateOfBirth": "2000-01-15"
  }'
```

### 7. Get Documents

```bash
curl http://localhost:3000/api/v1/users/documents \
  -H "Authorization: Bearer $TOKEN"
```

## University Endpoints

### 8. Search Universities

```bash
# Public search (limited results for free tier)
curl "http://localhost:3000/api/v1/universities/search?country=USA&limit=5"

# Authenticated search (more results for paid tiers)
curl "http://localhost:3000/api/v1/universities/search?country=USA&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Get University Details

```bash
curl http://localhost:3000/api/v1/universities/uni-001
```

### 10. Get Countries Filter

```bash
curl http://localhost:3000/api/v1/universities/filters/countries
```

## Subscription Endpoints

### 11. Get Available Plans

```bash
curl http://localhost:3000/api/v1/subscriptions/plans
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "asia",
        "name": "Country Focus Pack (Asia)",
        "price": 25,
        "currency": "USD",
        "validity": "2 years",
        "features": [...]
      },
      {
        "id": "europe",
        "name": "Country Focus Pack (Europe)",
        "price": 50,
        ...
      },
      {
        "id": "global",
        "name": "Global Application Pack",
        "price": 100,
        "popular": true,
        ...
      }
    ]
  }
}
```

### 12. Create Subscription

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "global",
    "paymentMethod": "credit_card"
  }'
```

### 13. Get My Subscriptions

```bash
curl http://localhost:3000/api/v1/subscriptions/my-subscriptions \
  -H "Authorization: Bearer $TOKEN"
```

## Application Endpoints

### 14. Submit Application

```bash
curl -X POST http://localhost:3000/api/v1/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "uni-001",
    "programId": "prog-001",
    "personalStatement": "I am passionate about computer science..."
  }'
```

### 15. Get Applications

```bash
# All applications
curl "http://localhost:3000/api/v1/applications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl "http://localhost:3000/api/v1/applications?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

### 16. Get Application Details

```bash
curl http://localhost:3000/api/v1/applications/app-id \
  -H "Authorization: Bearer $TOKEN"
```

## Payment Endpoints

### 17. Create Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub-id",
    "paymentMethod": "credit_card",
    "amount": 100,
    "cardDetails": {
      "cardNumber": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "cvv": "123",
      "cardholderName": "John Doe"
    }
  }'
```

### 18. Verify Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment-id",
    "transactionHash": "0x..."
  }'
```

### 19. Get Payment History

```bash
curl http://localhost:3000/api/v1/payments/history \
  -H "Authorization: Bearer $TOKEN"
```

## Scholarship Endpoints

### 20. Get Scholarships

```bash
# All scholarships
curl "http://localhost:3000/api/v1/scholarships?page=1&limit=10"

# Filter by country
curl "http://localhost:3000/api/v1/scholarships?country=USA"

# Filter by level
curl "http://localhost:3000/api/v1/scholarships?level=master"
```

### 21. Get Scholarship Details

```bash
curl http://localhost:3000/api/v1/scholarships/sch-001
```

### 22. Auto-Match Scholarships (Premium Only)

```bash
curl -X POST http://localhost:3000/api/v1/scholarships/auto-match \
  -H "Authorization: Bearer $TOKEN"
```

## Course Endpoints

### 23. Get Courses

```bash
# All courses
curl "http://localhost:3000/api/v1/courses?page=1&limit=10"

# Free courses only
curl "http://localhost:3000/api/v1/courses?type=free"

# Paid courses only
curl "http://localhost:3000/api/v1/courses?type=paid"
```

### 24. Get Course Details

```bash
curl http://localhost:3000/api/v1/courses/course-001
```

### 25. Enroll in Course

```bash
curl -X POST http://localhost:3000/api/v1/courses/course-001/enroll \
  -H "Authorization: Bearer $TOKEN"
```

## AI Chat Endpoints

### 26. Send Chat Message

```bash
# Start new conversation
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the requirements for studying in USA?"
  }'

# Continue conversation
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-id",
    "message": "Tell me more about TOEFL requirements"
  }'
```

### 27. Get Conversation History

```bash
curl http://localhost:3000/api/v1/chat/conversations/conv-id \
  -H "Authorization: Bearer $TOKEN"
```

### 28. Get All Conversations

```bash
curl http://localhost:3000/api/v1/chat/conversations \
  -H "Authorization: Bearer $TOKEN"
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions/subscription)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Testing with Postman

1. Import the API into Postman
2. Set environment variable `baseUrl` = `http://localhost:3000/api/v1`
3. Set environment variable `token` = (get from login response)
4. Use `{{baseUrl}}` and `{{token}}` in your requests

## Rate Limiting

- Free users: 100 requests per 15 minutes
- Paid users: Same limit (can be increased in production)
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 7 days (configurable in `.env`).

## Testing Flow

1. Register a new user
2. Login to get token
3. View available subscription plans
4. Search universities
5. Submit applications (within free tier limits)
6. Create subscription for more features
7. Use premium features (auto-match scholarships)
8. Use AI chat support

## Production Testing

Replace `localhost:3000` with `https://www.studyproglobal.com.bd` in all examples above.

Example:
```bash
curl https://www.studyproglobal.com.bd/api/health
```
