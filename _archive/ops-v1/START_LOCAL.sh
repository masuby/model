#!/bin/bash

echo "=========================================="
echo "  INFORM Tanzania - Local Setup & Start"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo ""
    echo "Please install Node.js first:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y nodejs npm"
    echo ""
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    echo ""
    echo "Installing npm..."
    sudo apt-get install -y npm

    if ! command -v npm &> /dev/null; then
        echo ""
        echo "❌ Failed to install npm. Please install manually:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y npm"
        echo ""
        exit 1
    fi
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Navigate to project
cd /home/kaijage/model/inform/masuby-model

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    echo "   This may take a few minutes..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ npm install failed!"
        echo ""
        echo "Try manually:"
        echo "  cd /home/kaijage/model/inform/masuby-model"
        echo "  npm install"
        exit 1
    fi
    echo ""
fi

# Check GeoJSON files
echo "🗺️  Checking boundary files..."
if [ ! -f "public/geojson/ADM1.geojson" ] || [ ! -f "public/geojson/ADM2.geojson" ]; then
    echo "   Copying GeoJSON files..."
    mkdir -p public/geojson
    cp /home/kaijage/model/inform/Boundaries/adm1/adm1.geojson public/geojson/ADM1.geojson
    cp /home/kaijage/model/inform/Boundaries/adm2/adm2.geojson public/geojson/ADM2.geojson
    echo "   ✅ Boundary files ready"
else
    echo "   ✅ Boundary files already exist"
fi

echo ""
echo "=========================================="
echo "  🚀 Starting Development Server..."
echo "=========================================="
echo ""
echo "The app will open at: http://localhost:5173"
echo ""
echo "📊 To use INFORM visualizations:"
echo "   1. Load: Tanzania - Country Model Template.xlsx"
echo "   2. Click: Select Visualization dropdown"
echo "   3. Choose: 🎯 INFORM Risk Dashboard"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start dev server
npm run dev
