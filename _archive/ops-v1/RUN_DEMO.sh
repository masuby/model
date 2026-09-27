#!/bin/bash

# ============================================
# STANDALONE WARNING SYSTEM - LOCAL DEMO
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚨 HAZARD & PMO STANDALONE SYSTEM - LOCAL DEMO SETUP     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

echo "📂 Current directory: $(pwd)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a minute)..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is already in use. Using port 3001 instead..."
    echo ""
    PORT=3001 npm start
else
    echo "🚀 Starting development server..."
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  📍 ACCESS THE DEMO AT:"
    echo ""
    echo "     🌐 http://localhost:3000"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  📋 TESTING QUICK STEPS:"
    echo ""
    echo "  1️⃣  Click 'Hazard Input' tab"
    echo "  2️⃣  Select TMA institution"
    echo "  3️⃣  Click 5+ districts on map"
    echo "  4️⃣  Click 'Submit Warning'"
    echo "  5️⃣  Switch to 'PMO Dashboard' tab"
    echo "  6️⃣  Click hazard and 'Issue Warning'"
    echo ""
    echo "  🐛 DEBUGGING:"
    echo ""
    echo "  • Press F12 to open DevTools"
    echo "  • Go to Console tab to see logs"
    echo "  • Check Network tab for errors"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""

    npm start
fi
