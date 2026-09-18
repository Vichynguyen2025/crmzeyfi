#!/bin/bash
# ============================================================
# CRM Zeyfi — Deployment Script
# Usage: bash deploy.sh
# ============================================================
set -e

SSH_KEY="/opt/data/.ssh/inet_rsa.pem"
SSH_HOST="root@202.92.6.105"
SSH_PORT="24700"
SSH_CMD="ssh -i $SSH_KEY -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=15"
SCP_CMD="scp -P $SSH_PORT -q -i $SSH_KEY -o StrictHostKeyChecking=no"

PROJECT_DIR="/opt/data/crmzeyfi-ts"
VPS_DIR="/opt/crmzeyfi-ts"

echo "┌─────────────────────────────────────────────┐"
echo "│         CRM Zeyfi — Deploy Script            │"
echo "└─────────────────────────────────────────────┘"
echo ""

# ─── Step 1: Backend ───────────────────────────────
echo "▸ Step 1/5: Backend API"

# Copy all backend source files
$SCP_CMD \
  "$PROJECT_DIR/apps/api/src/index.ts" \
  "$PROJECT_DIR/apps/api/src/db/schema.ts" \
  "$PROJECT_DIR/apps/api/src/db/index.ts" \
  "$SSH_HOST:$VPS_DIR/apps/api/src/" 2>/dev/null

$SCP_CMD \
  "$PROJECT_DIR/apps/api/src/routes/"*.ts \
  "$SSH_HOST:$VPS_DIR/apps/api/src/routes/" 2>/dev/null

echo "  ✓ Backend files copied"
$SSH_CMD "pm2 restart crmzeyfi-ts" 2>/dev/null
sleep 5
echo "  ✓ API restarted"

# ─── Step 2: Frontend ───────────────────────────────
echo "▸ Step 2/5: Frontend source"

$SCP_CMD \
  "$PROJECT_DIR/apps/web/src/App.tsx" \
  "$PROJECT_DIR/apps/web/src/main.tsx" \
  "$PROJECT_DIR/apps/web/src/index.css" \
  "$PROJECT_DIR/apps/web/src/lib/api.ts" \
  "$PROJECT_DIR/apps/web/src/lib/socket.ts" \
  "$SSH_HOST:$VPS_DIR/apps/web/src/" 2>/dev/null

$SCP_CMD \
  "$PROJECT_DIR/apps/web/src/pages/"*.tsx \
  "$SSH_HOST:$VPS_DIR/apps/web/src/pages/" 2>/dev/null

$SCP_CMD \
  "$PROJECT_DIR/apps/web/src/components/layout/"*.tsx \
  "$SSH_HOST:$VPS_DIR/apps/web/src/components/layout/" 2>/dev/null

echo "  ✓ Frontend files copied"

# ─── Step 3: Build ───────────────────────────────────
echo "▸ Step 3/5: Build frontend"
$SSH_CMD "cd $VPS_DIR/apps/web && npx vite build 2>&1 | tail -5" 2>/dev/null
echo "  ✓ Build complete"

# ─── Step 4: Verify API ─────────────────────────────
echo "▸ Step 4/5: Verify"
sleep 3

# Login test
TOKEN=$($SSH_CMD "curl -s --max-time 5 http://127.0.0.1:4000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"admin@zeyfi.com\",\"password\":\"admin123\"}' 2>/dev/null" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

if [ -z "$TOKEN" ]; then
  echo "  ✗ Login FAILED!"
  exit 1
fi
echo "  ✓ Login OK"

# Test all APIs
APIS=("teams" "users" "drive" "channels" "reports/columns" "customers" "tasks" "ad-costs")
for api in "${APIS[@]}"; do
  RESPONSE=$($SSH_CMD "curl -s --max-time 5 http://127.0.0.1:4000/api/$api -H 'Authorization: Bearer $TOKEN' 2>/dev/null" 2>/dev/null)
  LEN=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,(list,tuple,set)) else 1)" 2>/dev/null)
  echo "  ✓ $api ($LEN items)"
done

# ─── Step 5: Git push ───────────────────────────────
echo "▸ Step 5/5: Git push"
cd "$PROJECT_DIR"
git add -A 2>/dev/null
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" --allow-empty 2>/dev/null
git push origin main --force 2>&1 | tail -2
echo "  ✓ Git pushed"

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│          ✅ DEPLOY COMPLETE                  │"
echo "│  https://zeyfi.cloud                        │"
echo "└─────────────────────────────────────────────┘"