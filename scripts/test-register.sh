#!/bin/bash

# Test script for POST /auth/register endpoint

BASE_URL=http://localhost:3000

echo "=== Testing POST /auth/register ==="

# Check server is running
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo "Error: Server not running at $BASE_URL"
  exit 1
fi

# Generate unique username using Unix epoch timestamp
TEST_USER="testuser_$(date +%s)"

echo ""
echo "1. Successful registration"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USER\", \"password\": \"securepass123\"}" | jq .

echo ""
echo "2. Duplicate username (should fail)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USER\", \"password\": \"anotherpass\"}" | jq .

echo ""
echo "3. Missing username (should fail)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"password": "somepassword"}' | jq .

echo ""
echo "4. Missing password (should fail)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "usernopass"}' | jq .

