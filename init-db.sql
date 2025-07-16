-- Initialize database with basic setup
-- This script runs when the database container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (these will be created by Alembic migrations)
-- But having them here ensures they exist even if migrations haven't run

-- Basic database configuration
ALTER DATABASE imglink SET timezone TO 'UTC';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE imglink TO imglink;