# Testing JWT Authentication

## Prerequisites

1. Make sure Redis is running:
```bash
redis-cli ping
```

2. Ensure your PostgreSQL database has the USER_AUTH table:
```sql
CREATE TABLE IF NOT EXISTS USER_AUTH (
    user_pub_key VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255)
);
```

## Test Commands

### 1. Test Login (Get JWT Token)
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"public_key": "0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46"}'
```

Output should include an access_token:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46"
}
```

Save the token for use in subsequent requests.

### 2. Test Dashboard Access with JWT Token
```bash
curl -X GET "http://localhost:8000/api/dashboard/all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace YOUR_TOKEN_HERE with the access_token from the login response.

### 3. Test Token Validation
```bash
curl -X GET "http://localhost:8000/api/auth/validate-token" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test Logout
```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

After logout, trying to access a protected route with the same token should fail.

### 5. Backward Compatibility Test (using x-public-key header)
```bash
curl -X GET "http://localhost:8000/api/dashboard/all" \
  -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46"
```

## Troubleshooting

If you encounter issues:

1. Check Redis connection:
```bash
redis-cli info
```

2. Verify database connection (via psql or another tool)

3. Check logs for errors:
```bash
grep ERROR logs/neuralabs.log
```

4. Ensure the JWT configuration in config.yaml has a valid secret_key


These are some test curl commands to test the API
```bash
curl -X GET "http://localhost:8000/api/dashboard/all" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

curl -X GET "http://localhost:8000/api/dashboard/flows/recent" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

# Test API: Get flows under development
curl -X GET "http://localhost:8000/api/dashboard/flows/underdevelopment" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

curl -X GET "http://localhost:8000/api/dashboard/flows/published" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

# Test API: Get details for a specific flow (replace AGENT_ID with a real ID)
curl -X GET "http://localhost:8000/api/dashboard/flows/PM-3542974ceeaf69a01cd24288f66d52bb" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"
```
