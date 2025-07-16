#!/bin/bash

# Database reset script for ImgLink

echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
read -p "Are you sure you want to continue? (yes/no): " response

if [ "$response" != "yes" ]; then
    echo "Database reset cancelled."
    exit 0
fi

# Change to backend directory
cd "$(dirname "$0")"

# Load environment variables from root directory
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found in root directory!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

echo ""
echo "🗑️  Resetting database..."

# Method 1: Using Alembic (recommended)
echo "📍 Downgrading to base..."
alembic downgrade base

echo "🔄 Upgrading to latest..."
alembic upgrade head

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📝 Next steps:"
echo "- Start the backend server: uvicorn app.main:app --reload"
echo "- Register new users or run seed scripts"