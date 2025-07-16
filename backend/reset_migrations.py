#!/usr/bin/env python3
"""
Reset migration script to create a clean migration state.
This script will create a new migration based on the current models.
"""

import os
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent / "app"))

def main():
    """Reset migrations to clean state"""
    # Remove existing migration files
    versions_dir = Path(__file__).parent / "migrations" / "versions"
    if versions_dir.exists():
        for file in versions_dir.glob("*.py"):
            file.unlink()
    
    print("Removed existing migration files")
    
    # Create new migration
    os.system("alembic revision --autogenerate -m 'initial_clean_database'")
    
    print("Created new clean migration")
    print("Run 'alembic stamp head' to mark the current database as up to date")

if __name__ == "__main__":
    main()