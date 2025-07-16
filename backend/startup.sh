#!/bin/bash
set -e

echo "Starting ImgLink Backend..."

# Run database initialization
echo "Initializing database..."
python /app/init_db.py

# Start the application
echo "Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload