#!/usr/bin/env python3
"""
Script to create an admin user for ImgLink
Run this inside the backend container:
docker exec -it imglink-backend python create_admin.py
"""
import sys
import os
sys.path.append('/app')

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

# Create engine using settings
engine = create_engine(settings.DATABASE_URL)

# Create session
session = Session(engine)

print("ImgLink Admin User Creation")
print("=" * 50)

# Check for command line arguments
if len(sys.argv) == 4:
    email = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    print(f"Creating admin user: {email} ({username})")
else:
    # Interactive mode
    email = input("Enter admin email: ").strip()
    if not email:
        print("Email is required!")
        sys.exit(1)

    username = input("Enter admin username: ").strip()
    if not username:
        print("Username is required!")
        sys.exit(1)

    password = input("Enter admin password (min 8 chars): ").strip()
    if len(password) < 8:
        print("Password must be at least 8 characters!")
        sys.exit(1)

# Check if user already exists
existing_user = session.query(User).filter(
    (User.email == email) | (User.username == username)
).first()

if existing_user:
    print(f"\nUser already exists: {existing_user.email} ({existing_user.username})")
    
    if not existing_user.is_superuser:
        print("Upgrading to admin status...")
        existing_user.is_superuser = True
        existing_user.is_verified = True
        existing_user.tier = "premium"
        session.commit()
        print("✅ User upgraded to admin!")
    else:
        print("✅ User is already an admin!")
    
    session.close()
    sys.exit(0)

# Create admin user
admin_user = User(
    email=email,
    username=username,
    hashed_password=get_password_hash(password),
    is_active=True,
    is_superuser=True,
    is_verified=True,
    tier="premium"
)

try:
    session.add(admin_user)
    session.commit()
    print("\n✅ Admin user created successfully!")
    print(f"   Email: {email}")
    print(f"   Username: {username}")
    print(f"   Is Admin: Yes")
    print(f"   Is Verified: Yes")
    print(f"   Tier: premium")
    print("\nYou can now login with these credentials.")
except Exception as e:
    print(f"\n❌ Error creating admin user: {e}")
    session.rollback()
finally:
    session.close()