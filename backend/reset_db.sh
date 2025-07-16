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
echo "🔧 Verifying rate limits configuration..."
# Run a Python script to check rate limits
python3 -c "
import psycopg2
from urllib.parse import urlparse

# Parse DATABASE_URL
db_url = '$DATABASE_URL'
result = urlparse(db_url)

# Connect to database
conn = psycopg2.connect(
    database=result.path[1:],
    user=result.username,
    password=result.password,
    host=result.hostname,
    port=result.port
)

cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM rate_limits')
count = cur.fetchone()[0]
print(f'✓ Rate limits configured: {count} entries')

# Show some examples
cur.execute(\"\"\"
    SELECT endpoint, tier, requests, window 
    FROM rate_limits 
    WHERE endpoint IN ('/api/v1/images', '/api/v1/auth/login', 'default')
    ORDER BY endpoint, tier
    LIMIT 9
\"\"\")
for row in cur.fetchall():
    window_desc = f'{row[3]//3600}h' if row[3] >= 3600 else f'{row[3]//60}m'
    print(f'  - {row[0]:<25} {row[1]:<10} {row[2]:<6} requests per {window_desc}')

cur.close()
conn.close()
" || echo "⚠️  Could not verify rate limits configuration"

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📝 Next steps:"
echo "- Start the backend server: uvicorn app.main:app --reload"
echo "- Register new users or run seed scripts"
echo ""
echo "💡 Rate Limiting Info:"
echo "- Anonymous users: Limited API access"
echo "- Standard users: Normal rate limits (default for registered users)"
echo "- Premium users: 10x higher rate limits"
echo "- Check /api/v1/rate-limit/status for current limits"