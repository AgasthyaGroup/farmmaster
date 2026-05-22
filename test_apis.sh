#!/bin/bash

# Your JWT Token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZjNjIzMWY2NTkwMTUwMTgxYzg5MjYiLCJlbWFpbCI6ImFkbWluQGFubS5jb20iLCJyb2xlIjoiRkFSTV9BRE1JTiIsImZhcm1JZCI6IjY5ZmIxNGRjZGVjMjIzY2Y5NWM5ZGQxNSIsImlhdCI6MTc3OTQ0ODk2OSwiZXhwIjoxNzc5NTM1MzY5fQ.laDhtuMDNMZxAl_L3KPvTXJkUz2Xjzmk-3HmlbAElWM"
BASE_URL="https://farm.agasthyanutromilk.com/api"

# Array of all endpoints to test
ENDPOINTS=(
  "/cattle"
  "/health/treatments"
  "/health/vaccinations"
  "/operations/daily-feeding"
  "/operations/grass-collection"
  "/inventory/medicines"
  "/inventory/feed"
  "/milk/collections"
  "/milk/quality"
)

echo "============================================="
echo "🧪 Running Automated API Health Checks"
echo "============================================="
echo ""

for ENDPOINT in "${ENDPOINTS[@]}"; do
  echo "➡️  Testing: GET $ENDPOINT"
  
  # Run curl and grab just the HTTP status code and response body silently
  RESPONSE=$(curl -s -X GET "$BASE_URL$ENDPOINT" -H "Authorization: Bearer $TOKEN")
  
  echo "📦 Response: $RESPONSE"
  echo "---------------------------------------------"
done
 
echo "✅ All tests completed!"
