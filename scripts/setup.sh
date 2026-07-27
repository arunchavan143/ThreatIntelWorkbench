#!/bin/bash
# ============================================================
# Threat Intel Workbench Pro - Quick Setup Script
# ============================================================

echo "🛡️  Threat Intel Workbench Pro - Setup"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys!"
    echo "   Press any key to continue..."
    read
else
    echo "✅ .env already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Seed initial data
echo "🌱 Seeding initial data..."
npm run seed 2>/dev/null || echo "⚠️  No seed data found (skipping)"

echo "========================================"
echo "✅ Setup complete!"
echo "🚀 Run 'npm run dev' to start"
echo "🌐 Open http://localhost:3000"
echo "========================================"
