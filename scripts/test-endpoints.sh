#!/bin/bash

# Test script for Tasks REST API endpoints
# Requires: curl, jq

BASE_URL=http://localhost:3000

echo "=== Checking server ==="
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo "Server not running at $BASE_URL"
  exit 1
fi
echo "Server is up"

echo ""
echo "=== Creating tasks ==="

echo "Creating: Buy groceries"
TASK1=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread", "status": "pending"}')
TASK1_ID=$(echo "$TASK1" | jq -r '.id')
echo "$TASK1" | jq .

echo "Creating: Walk the dog"
TASK2=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Walk the dog", "status": "pending"}')
TASK2_ID=$(echo "$TASK2" | jq -r '.id')
echo "$TASK2" | jq .

echo ""
echo "=== Listing all tasks ==="
curl -s "$BASE_URL/tasks" | jq .

echo ""
echo "=== Updating task status ==="
echo "Marking 'Buy groceries' as completed"
curl -s -X PUT "$BASE_URL/tasks/$TASK1_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}' | jq .

echo ""
echo "=== Deleting task ==="
echo "Deleting 'Buy groceries'"
curl -s -X DELETE "$BASE_URL/tasks/$TASK1_ID" | jq .

echo ""
echo "=== Final task list ==="
curl -s "$BASE_URL/tasks" | jq .

echo ""
echo "Done! Created 2, updated 1, deleted 1, remaining 1"
