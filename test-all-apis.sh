#!/bin/bash

BASE_URL="http://localhost:5001/api"
TOKEN=""

echo "=== Comprehensive API Testing ==="
echo ""

# Test Health
echo "✅ 1. Health Check"
curl -s http://localhost:5001/health | jq .
echo ""

# Login and get token
echo "✅ 2. Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@4dcholi.com","password":"admin123"}')
echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo ""

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ 3. Get Current User"
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Products
echo "✅ 4. List Products"
curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 5. Create Product"
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Chaniyacholi",
    "description": "A test product",
    "code": "CH-001",
    "category": "Kids",
    "defaultRent": 500
  }')
echo "$PRODUCT_RESPONSE" | jq .
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '._id')
echo ""

echo "✅ 6. Get Product by ID"
curl -s -X GET "$BASE_URL/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 7. Update Product"
curl -s -X PUT "$BASE_URL/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Chaniyacholi",
    "defaultRent": 600
  }' | jq .
echo ""

# Bookings
echo "✅ 8. List Bookings"
curl -s -X GET "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 9. Check Conflicts (should return empty)"
curl -s -X POST "$BASE_URL/bookings/check-conflicts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"fromDateTime\": \"2025-12-01T10:00:00Z\",
    \"toDateTime\": \"2025-12-01T18:00:00Z\"
  }" | jq .
echo ""

echo "✅ 10. Create Booking"
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"customerName\": \"Test Customer\",
    \"customerPhone\": \"1234567890\",
    \"fromDateTime\": \"2025-12-01T10:00:00Z\",
    \"toDateTime\": \"2025-12-01T18:00:00Z\",
    \"decidedRent\": 500,
    \"advanceAmount\": 200,
    \"additionalItemsDescription\": \"Dupatta included\"
  }")
echo "$BOOKING_RESPONSE" | jq .
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '._id')
echo ""

echo "✅ 11. Get Booking by ID"
curl -s -X GET "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 12. Update Booking Status to ISSUED"
curl -s -X PATCH "$BASE_URL/bookings/$BOOKING_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ISSUED"}' | jq .
echo ""

echo "✅ 13. Add Payment"
curl -s -X POST "$BASE_URL/bookings/$BOOKING_ID/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RENT_REMAINING",
    "amount": 200,
    "note": "Partial payment"
  }' | jq .
echo ""

echo "✅ 14. Update Booking Status to RETURNED"
curl -s -X PATCH "$BASE_URL/bookings/$BOOKING_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "RETURNED"}' | jq .
echo ""

echo "✅ 15. Update Booking (change advance)"
curl -s -X PUT "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "advanceAmount": 250
  }' | jq .
echo ""

# Dashboard
echo "✅ 16. Dashboard Stats"
curl -s -X GET "$BASE_URL/dashboard/stats?date=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 17. Dashboard Bookings"
curl -s -X GET "$BASE_URL/dashboard/bookings?date=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "=== All API Tests Complete! ==="

