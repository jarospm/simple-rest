#!/bin/bash

# Test script for /tasks CRUD endpoints
# Requires test user: node scripts/seed-test-user.js

BASE_URL=http://localhost:3000

echo "=== Testing /tasks CRUD Endpoints ==="

# Check server is running
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo "Error: Server not running at $BASE_URL. Run: npm run dev"
  exit 1
fi

# Get JWT token
echo ""
echo "--- Setup: Authenticating ---"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to authenticate. Run: npm run seed"
  exit 1
fi
echo "Authenticated"

# Bearer token header for authenticated requests
AUTH="Authorization: Bearer $TOKEN"

# --- Auth failures ---
echo ""
echo "--- 1. Auth Failures ---"

echo ""
echo "1.1 Request without token (should fail)"
curl -s "$BASE_URL/tasks" | jq .

echo ""
echo "1.2 Invalid token (should fail)"
curl -s "$BASE_URL/tasks" -H "Authorization: Bearer invalid.token" | jq .

# --- Create ---
echo ""
echo "--- 2. Create Tasks (POST) ---"

echo ""
echo "2.1 Create task with all fields"
TASK1=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title": "Test Task 1", "description": "Description", "status": "pending"}')
echo "$TASK1" | jq .
TASK1_ID=$(echo "$TASK1" | jq -r '.id')

echo ""
echo "2.2 Create task without description"
TASK2=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title": "Task No Desc", "status": "in-progress"}')
echo "$TASK2" | jq .
TASK2_ID=$(echo "$TASK2" | jq -r '.id')

echo ""
echo "2.3 Missing title (should fail)"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"status": "pending"}' | jq .

echo ""
echo "2.4 Missing status (should fail)"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title": "No status"}' | jq .

echo ""
echo "2.5 Invalid status (should fail)"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title": "Bad status", "status": "invalid"}' | jq .

# --- Read ---
echo ""
echo "--- 3. Read Tasks (GET) ---"

echo ""
echo "3.1 List all tasks"
curl -s "$BASE_URL/tasks" -H "$AUTH" | jq .

echo ""
echo "3.2 Get task by ID"
curl -s "$BASE_URL/tasks/$TASK1_ID" -H "$AUTH" | jq .

echo ""
echo "3.3 Get non-existent task (should fail)"
curl -s "$BASE_URL/tasks/nonexistent-id" -H "$AUTH" | jq .

# --- Update ---
echo ""
echo "--- 4. Update Tasks (PATCH) ---"

echo ""
echo "4.1 Update title"
curl -s -X PATCH "$BASE_URL/tasks/$TASK1_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title": "Updated Title"}' | jq .

echo ""
echo "4.2 Update status"
curl -s -X PATCH "$BASE_URL/tasks/$TASK1_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"status": "completed"}' | jq .

echo ""
echo "4.3 Invalid status (should fail)"
curl -s -X PATCH "$BASE_URL/tasks/$TASK1_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"status": "bad"}' | jq .

echo ""
echo "4.4 Update non-existent task (should fail)"
curl -s -X PATCH "$BASE_URL/tasks/nonexistent" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title": "X"}' | jq .

# --- Delete ---
echo ""
echo "--- 5. Delete Tasks (DELETE) ---"

echo ""
echo "5.1 Delete task"
curl -s -X DELETE "$BASE_URL/tasks/$TASK1_ID" -H "$AUTH" | jq .

echo ""
echo "5.2 Verify deletion (should fail)"
curl -s "$BASE_URL/tasks/$TASK1_ID" -H "$AUTH" | jq .

echo ""
echo "5.3 Delete non-existent task (should fail)"
curl -s -X DELETE "$BASE_URL/tasks/nonexistent" -H "$AUTH" | jq .

# Cleanup
curl -s -X DELETE "$BASE_URL/tasks/$TASK2_ID" -H "$AUTH" > /dev/null

echo ""
echo "=== Done ==="
