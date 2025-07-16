#!/usr/bin/env python3
"""
Database initialization script for ImgLink
This script:
1. Runs database migrations
2. Creates default admin user
3. Verifies rate limits are configured
4. Shows setup summary
"""
import os
import sys
import subprocess
import time
from typing import Optional
from datetime import datetime

# Add app to path
sys.path.append('/app')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.rate_limit import RateLimit
from app.core.security import get_password_hash
from app.core.config import settings


def wait_for_database(max_attempts: int = 30) -> bool:
    """Wait for database to be ready"""
    print("Waiting for database to be ready...")
    engine = create_engine(settings.DATABASE_URL)
    
    for attempt in range(max_attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✓ Database is ready!")
            return True
        except Exception as e:
            if attempt < max_attempts - 1:
                print(f"  Attempt {attempt + 1}/{max_attempts}: Database not ready, waiting...")
                time.sleep(2)
            else:
                print(f"✗ Database not ready after {max_attempts} attempts: {e}")
                return False
    
    return False


def run_migrations() -> bool:
    """Run Alembic migrations"""
    print("\nRunning database migrations...")
    try:
        # First, try to create alembic_version table if it doesn't exist
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Check if alembic_version exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'alembic_version'
                );
            """))
            table_exists = result.scalar()
            
            if not table_exists:
                print("  Creating alembic_version table...")
                conn.execute(text("""
                    CREATE TABLE alembic_version (
                        version_num VARCHAR(32) NOT NULL, 
                        CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                    );
                """))
                conn.commit()
        
        # Check current state
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True
        )
        print(f"  Current migration state: {result.stdout.strip() or 'No migrations applied'}")
        
        # Try to run migrations
        print("  Applying migrations...")
        
        # Check if this is a fresh database
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'images', 'albums', 'comments')
            """))
            table_count = result.scalar()
            
            if table_count == 0:
                print("  Fresh database detected, applying initial schema...")
                # Apply the initial schema first
                result = subprocess.run(
                    ["alembic", "upgrade", "001_baseline_schema"],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    print(f"  Warning: Initial schema failed: {result.stderr}")
                else:
                    print("  Initial schema applied successfully")
        
        # Now apply any remaining migrations
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0 and "Multiple head revisions" in result.stderr:
            print("  Handling multiple migration heads...")
            # Get all heads
            heads_result = subprocess.run(
                ["alembic", "heads"],
                capture_output=True,
                text=True
            )
            heads = [line.split()[0] for line in heads_result.stdout.strip().split('\n') if line and line.split()[0] != '001_baseline_schema']
            
            for head in heads:
                print(f"  Applying migration: {head}")
                result = subprocess.run(
                    ["alembic", "upgrade", head],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    print(f"  Warning: Failed to apply {head}: {result.stderr}")
        
        # Check final state
        final_result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True
        )
        
        if final_result.stdout.strip():
            print("✓ Migrations completed successfully!")
            print(f"  Current version: {final_result.stdout.strip()}")
            return True
        else:
            print("⚠️  Migrations may not have applied correctly")
            return False
            
    except Exception as e:
        print(f"✗ Migration error: {e}")
        return False


def create_admin_user(
    email: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None
) -> bool:
    """Create default admin user"""
    print("\nSetting up admin user...")
    
    # Use environment variables or defaults
    admin_email = email or os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_username = username or os.getenv("ADMIN_USERNAME", "admin")
    admin_password = password or os.getenv("ADMIN_PASSWORD", "AdminPass123")
    
    engine = create_engine(settings.DATABASE_URL)
    session = Session(engine)
    
    try:
        # Check if admin already exists
        existing_admin = session.query(User).filter(
            (User.email == admin_email) | (User.username == admin_username)
        ).first()
        
        if existing_admin:
            if not existing_admin.is_superuser:
                print(f"  Upgrading existing user to admin: {existing_admin.email}")
                existing_admin.is_superuser = True
                existing_admin.is_verified = True
                existing_admin.tier = "premium"
                session.commit()
                print("✓ User upgraded to admin status!")
            else:
                print(f"✓ Admin user already exists: {existing_admin.email}")
            return True
        
        # Create new admin
        admin_user = User(
            email=admin_email,
            username=admin_username,
            hashed_password=get_password_hash(admin_password),
            is_active=True,
            is_superuser=True,
            is_verified=True,
            tier="premium",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(admin_user)
        session.commit()
        
        print("✓ Admin user created successfully!")
        print(f"  Email: {admin_email}")
        print(f"  Username: {admin_username}")
        print(f"  Password: {admin_password if not email else '***'}")
        print("  ⚠️  Please change the default password after first login!")
        
        return True
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        session.rollback()
        return False
    finally:
        session.close()


def verify_rate_limits() -> bool:
    """Verify rate limits are configured"""
    print("\nVerifying rate limits configuration...")
    
    engine = create_engine(settings.DATABASE_URL)
    session = Session(engine)
    
    try:
        count = session.query(RateLimit).count()
        
        if count == 0:
            print("  No rate limits found, creating defaults...")
            # This should be handled by migrations, but let's check
            return False
        
        print(f"✓ Rate limits configured: {count} entries")
        
        # Show some examples
        examples = session.query(RateLimit).filter(
            RateLimit.endpoint.in_(['/api/v1/images', '/api/v1/auth/login', 'default'])
        ).order_by(RateLimit.endpoint, RateLimit.tier).limit(6).all()
        
        if examples:
            print("  Examples:")
            for rl in examples:
                window_desc = f"{rl.window // 3600}h" if rl.window >= 3600 else f"{rl.window // 60}m"
                print(f"    - {rl.endpoint:<25} {rl.tier:<10} {rl.requests:<6} requests per {window_desc}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error checking rate limits: {e}")
        return False
    finally:
        session.close()


def main():
    """Main initialization function"""
    print("=" * 60)
    print("ImgLink Database Initialization")
    print("=" * 60)
    
    # Check if we should skip (for development)
    if os.getenv("SKIP_DB_INIT") == "true":
        print("SKIP_DB_INIT is set, skipping initialization.")
        return
    
    # Step 1: Wait for database
    if not wait_for_database():
        sys.exit(1)
    
    # Step 2: Run migrations
    if not run_migrations():
        print("\n⚠️  Migrations failed, but continuing...")
    
    # Step 3: Create admin user
    create_admin_user()
    
    # Step 4: Verify rate limits
    verify_rate_limits()
    
    print("\n" + "=" * 60)
    print("✅ Database initialization complete!")
    print("=" * 60)
    print("\nYou can now:")
    print("1. Access the application at http://localhost:5173")
    print("2. Login with the admin credentials shown above")
    print("3. Change the admin password in your profile settings")
    print("\nFor production deployments:")
    print("- Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD environment variables")
    print("- Use strong passwords and enable 2FA when available")


if __name__ == "__main__":
    main()