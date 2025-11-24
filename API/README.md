# API Documentation - Study Pro Global

This folder contains the API documentation and related files for the Study Pro Global EdTech portal.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.studyproglobal.com/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "country": "Bangladesh",
  "academicLevel": "bachelor"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": "uuid",
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "subscriptionType": "free"
    }
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": { ... }
  }
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Profile

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "country": "Bangladesh",
    "academicLevel": "bachelor",
    "subscriptionType": "free",
    "freeApplicationsUsed": 0,
    "profileComplete": 45
  }
}
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+8801234567890",
  "address": "Dhaka, Bangladesh",
  "dateOfBirth": "2000-01-01"
}

Response: 200 OK
```

#### Upload Document
```http
POST /users/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <CV_FILE>
documentType: "cv"

Response: 201 Created
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "url": "https://...",
    "type": "cv"
  }
}
```

### Universities

#### Search Universities
```http
GET /universities/search?country=usa&level=master&limit=10&page=1
Authorization: Bearer <token> (optional - limited results for free users)

Response: 200 OK
{
  "success": true,
  "data": {
    "universities": [
      {
        "id": "uuid",
        "name": "Harvard University",
        "country": "USA",
        "programs": [...],
        "ranking": 1,
        "tuitionRange": "$50,000 - $70,000",
        "hasScholarships": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "hasMore": true
    }
  }
}
```

#### Get University Details
```http
GET /universities/:id
Authorization: Bearer <token> (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Harvard University",
    "country": "USA",
    "description": "...",
    "programs": [...],
    "admissionRequirements": [...],
    "deadlines": [...],
    "contactInfo": {...}
  }
}
```

### Applications

#### Submit Application
```http
POST /applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "universityId": "uuid",
  "programId": "uuid",
  "documents": ["doc_id_1", "doc_id_2"],
  "personalStatement": "..."
}

Response: 201 Created
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "uuid",
    "status": "pending",
    "submittedAt": "2025-01-01T00:00:00Z"
  }
}
```

#### Get Applications
```http
GET /applications?status=pending&page=1&limit=10
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "university": {...},
        "program": {...},
        "status": "pending",
        "submittedAt": "...",
        "lastUpdated": "..."
      }
    ]
  }
}
```

### Subscriptions

#### Get Available Plans
```http
GET /subscriptions/plans

Response: 200 OK
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
        "currency": "USD",
        "validity": "2 years",
        "features": [...]
      },
      {
        "id": "global",
        "name": "Global Application Pack",
        "price": 100,
        "currency": "USD",
        "validity": "2 years",
        "features": [...],
        "popular": true
      }
    ]
  }
}
```

#### Create Subscription
```http
POST /subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "global",
  "paymentMethod": "myxn_token" // or "credit_card"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "subscriptionId": "uuid",
    "paymentUrl": "https://payment.gateway.com/...",
    "orderId": "order_123"
  }
}
```

### Payments

#### Create Payment
```http
POST /payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "uuid",
  "paymentMethod": "myxn_token", // or "credit_card"
  "amount": 100,
  "cardDetails": { // Required only for credit_card
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "paymentUrl": "...",
    "qrCode": "..." (for crypto payments)
  }
}
```

#### Verify Payment
```http
POST /payments/verify
Content-Type: application/json

{
  "paymentId": "uuid",
  "transactionHash": "0x..." (for crypto)
}

Response: 200 OK
{
  "success": true,
  "data": {
    "verified": true,
    "subscriptionActivated": true
  }
}
```

### Scholarships

#### Get Scholarships
```http
GET /scholarships?country=usa&level=master&page=1
Authorization: Bearer <token> (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "scholarships": [
      {
        "id": "uuid",
        "name": "Fulbright Scholarship",
        "country": "USA",
        "amount": "$50,000",
        "eligibility": [...],
        "deadline": "2025-12-31"
      }
    ]
  }
}
```

#### Auto Match Scholarships (Premium)
```http
POST /scholarships/auto-match
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "matches": [
      {
        "scholarship": {...},
        "matchScore": 95,
        "reasons": ["Academic excellence", "Country match"]
      }
    ]
  }
}
```

### Courses

#### Get Courses
```http
GET /courses?type=free&page=1

Response: 200 OK
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "uuid",
        "title": "IELTS Preparation",
        "type": "paid",
        "price": 49,
        "description": "...",
        "duration": "4 weeks"
      }
    ]
  }
}
```

#### Enroll in Course
```http
POST /courses/:id/enroll
Authorization: Bearer <token>

Response: 201 Created
```

### AI Chat Support

#### Send Message
```http
POST /chat/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are the requirements for studying in USA?",
  "conversationId": "uuid" (optional)
}

Response: 200 OK
{
  "success": true,
  "data": {
    "response": "To study in the USA, you typically need...",
    "conversationId": "uuid"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (e.g., premium feature on free plan)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- Free users: 100 requests/hour
- Paid users: 1000 requests/hour

## Webhooks

### Payment Webhook
```http
POST /webhooks/payment
Content-Type: application/json
X-Webhook-Signature: <signature>

{
  "event": "payment.completed",
  "data": {
    "paymentId": "uuid",
    "orderId": "order_123",
    "status": "completed"
  }
}
```

## Testing

Use the provided Postman collection or OpenAPI/Swagger documentation for testing.

## Support

For API support, contact: api-support@studyproglobal.com
