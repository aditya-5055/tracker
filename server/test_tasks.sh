#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ConsistencyOS — Task API end-to-end test script
# Usage:  bash test_tasks.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
BASE="http://localhost:5000/api"
COOKIE_JAR="/tmp/cos_test_cookies.txt"

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
pass() { echo -e "${GREEN}✅  PASS${NC}  $1"; }
fail() { echo -e "${RED}❌  FAIL${NC}  $1"; }
section() { echo -e "\n${CYAN}══ $1 ══${NC}"; }

# Helper: run curl and pretty-print
req() {
  local label="$1"; shift
  echo -e "\n→ $label"
  local body
  body=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$@")
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
  echo "$body"
}

rm -f "$COOKIE_JAR"
TODAY=$(date +%Y-%m-%d)
MONTH=$(date +%Y-%m)

# ─────────────────────────────────────────────────────────────────────────────
section "1. Health check"
req "GET /health" -X GET "$BASE/health"
pass "Health"

# ─────────────────────────────────────────────────────────────────────────────
section "2. Register (sets httpOnly cookie)"
SIGNUP=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Aditya\",\"email\":\"aditya_task_test_$(date +%s)@test.com\",\"password\":\"test123\"}")
echo "$SIGNUP" | python3 -m json.tool
echo "$SIGNUP" | grep -q '"success":true' && pass "Signup" || fail "Signup"

# ─────────────────────────────────────────────────────────────────────────────
section "3. GET /auth/me (cookie auth)"
ME=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X GET "$BASE/auth/me")
echo "$ME" | python3 -m json.tool
echo "$ME" | grep -q '"success":true' && pass "/auth/me" || fail "/auth/me"

# ─────────────────────────────────────────────────────────────────────────────
section "4. Create Task 1  (09:00–10:00  DSA)"
T1=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"startTime\":\"09:00\",\"endTime\":\"10:00\",\"title\":\"Leetcode - Two Sum\",\"category\":\"DSA\",\"notes\":\"https://leetcode.com/problems/two-sum/\"}")
echo "$T1" | python3 -m json.tool
echo "$T1" | grep -q '"success":true' && pass "Create Task 1" || fail "Create Task 1"
TASK1_ID=$(echo "$T1" | python3 -c "import sys,json; print(json.load(sys.stdin)['task']['_id'])")
echo "  Task 1 ID: $TASK1_ID"

# ─────────────────────────────────────────────────────────────────────────────
section "5. Create Task 2  (11:00–12:00  OS)"
T2=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"startTime\":\"11:00\",\"endTime\":\"12:00\",\"title\":\"Process Scheduling — Round Robin\",\"category\":\"OS\"}")
echo "$T2" | python3 -m json.tool
echo "$T2" | grep -q '"success":true' && pass "Create Task 2" || fail "Create Task 2"
TASK2_ID=$(echo "$T2" | python3 -c "import sys,json; print(json.load(sys.stdin)['task']['_id'])")

# ─────────────────────────────────────────────────────────────────────────────
section "6. OVERLAP test — 09:30–10:30 should conflict with Task 1"
OVL=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"startTime\":\"09:30\",\"endTime\":\"10:30\",\"title\":\"Overlap test\",\"category\":\"DSA\"}")
echo "$OVL" | python3 -m json.tool
echo "$OVL" | grep -q '"success":false' && pass "Overlap detected correctly" || fail "Overlap detection missed"

# ─────────────────────────────────────────────────────────────────────────────
section "7. OVERLAP test — 08:00–09:01 (just clips Task 1 start)"
OVL2=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"startTime\":\"08:00\",\"endTime\":\"09:01\",\"title\":\"Clip test\",\"category\":\"DSA\"}")
echo "$OVL2" | python3 -m json.tool
echo "$OVL2" | grep -q '"success":false' && pass "Edge overlap detected" || fail "Edge overlap missed"

# ─────────────────────────────────────────────────────────────────────────────
section "8. VALID adjacent slot — 08:00–09:00 (ends exactly when Task 1 starts)"
ADJ=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"startTime\":\"08:00\",\"endTime\":\"09:00\",\"title\":\"Morning Warmup\",\"category\":\"DSA\"}")
echo "$ADJ" | python3 -m json.tool
echo "$ADJ" | grep -q '"success":true' && pass "Adjacent slot allowed" || fail "Adjacent slot rejected wrongly"

# ─────────────────────────────────────────────────────────────────────────────
section "9. GET /tasks?date=$TODAY"
DAY=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X GET "$BASE/tasks?date=$TODAY")
echo "$DAY" | python3 -m json.tool
echo "$DAY" | grep -q '"success":true' && pass "GET day tasks" || fail "GET day tasks"
TASK_COUNT=$(echo "$DAY" | python3 -c "import sys,json; print(json.load(sys.stdin)['summary']['total'])")
echo "  Tasks on $TODAY: $TASK_COUNT"

# ─────────────────────────────────────────────────────────────────────────────
section "10. PATCH Task 1 — mark as completed"
PATCH=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X PATCH "$BASE/tasks/$TASK1_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","notes":"Solved in 10 min — O(n) hashmap"}')
echo "$PATCH" | python3 -m json.tool
echo "$PATCH" | grep -q '"status":"completed"' && pass "PATCH status" || fail "PATCH status"

# ─────────────────────────────────────────────────────────────────────────────
section "11. GET /tasks?month=$MONTH (heatmap)"
HEAT=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X GET "$BASE/tasks?month=$MONTH")
echo "$HEAT" | python3 -m json.tool
echo "$HEAT" | grep -q '"success":true' && pass "GET month heatmap" || fail "GET month heatmap"

# ─────────────────────────────────────────────────────────────────────────────
section "12. DELETE Task 2"
DEL=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X DELETE "$BASE/tasks/$TASK2_ID")
echo "$DEL" | python3 -m json.tool
echo "$DEL" | grep -q '"success":true' && pass "DELETE task" || fail "DELETE task"

# ─────────────────────────────────────────────────────────────────────────────
section "13. DELETE non-existent task → 404"
DEL404=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X DELETE "$BASE/tasks/000000000000000000000000")
echo "$DEL404" | python3 -m json.tool
echo "$DEL404" | grep -q '"success":false' && pass "DELETE 404 handled" || fail "DELETE 404 wrong response"

# ─────────────────────────────────────────────────────────────────────────────
section "14. POST without auth → 401"
NOAUTH=$(curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"startTime\":\"14:00\",\"endTime\":\"15:00\",\"title\":\"Unauthorised\",\"category\":\"DSA\"}")
echo "$NOAUTH" | python3 -m json.tool
echo "$NOAUTH" | grep -q '"success":false' && pass "Unauthenticated 401" || fail "Unauthenticated 401"

# ─────────────────────────────────────────────────────────────────────────────
section "15. Logout"
LOGOUT=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/auth/logout")
echo "$LOGOUT" | python3 -m json.tool
echo "$LOGOUT" | grep -q '"success":true' && pass "Logout" || fail "Logout"

# ─────────────────────────────────────────────────────────────────────────────
section "16. POST after logout → 401"
POSTLOGOUT=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X GET "$BASE/auth/me")
echo "$POSTLOGOUT" | python3 -m json.tool
echo "$POSTLOGOUT" | grep -q '"success":false' && pass "Post-logout 401" || fail "Post-logout 401"

rm -f "$COOKIE_JAR"
echo -e "\n${CYAN}═══════════════════════════════════${NC}"
echo -e "${GREEN}All tests complete!${NC}"
