#!/bin/bash

# Test script for POST /auth/login endpoint
# Requires test user: node scripts/seed-test-user.js

BASE_URL=http://localhost:3000

echo "=== Testing POST /auth/login ==="

# Check server is running
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo "Error: Server not running at $BASE_URL. Run: npm run dev"
  exit 1
fi

# Check if test user exists by attempting login
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}')
if echo "$RESPONSE" | grep -q "User not found"; then
  echo "Error: Test user not seeded. Run: npm run seed"
  exit 1
fi

echo ""
echo "1. Successful login"
echo "$RESPONSE" | jq .

echo ""
echo "2. Wrong password (should return 'Wrong password')"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "wrongpassword"}' | jq .

echo ""
echo "3. Non-existent user (should return 'User not found')"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "nonexistent_user", "password": "anypassword"}' | jq .

echo ""
echo "4. Missing username (should fail)"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "somepassword"}' | jq .

echo ""
echo "5. Missing password (should fail)"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}' | jq .

