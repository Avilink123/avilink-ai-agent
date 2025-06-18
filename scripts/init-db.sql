-- Initialize Avilink AI Agent Database
-- This script sets up the initial database structure

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial tables (Prisma will handle the rest)
-- This is just to ensure the database is properly initialized

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE avilink TO avilink;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO avilink;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO avilink;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO avilink;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO avilink;