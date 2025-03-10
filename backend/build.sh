#!/usr/bin/env bash
# Exit on error and print commands as they're executed
set -o errexit
set -o pipefail
set -o nounset

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Initializing database..."
python init_db.py

# Create default admin user for production if doesn't exist
echo "Setting up admin user..."
python -c "from database import SessionLocal; import models; from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); db = SessionLocal(); admin_exists = db.query(models.Admin).filter(models.Admin.username == 'admin').first(); exit_code = 0 if admin_exists else 1; db.close(); exit(exit_code)" || python -c "from database import SessionLocal; import models; from passlib.context import CryptContext; import os; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); db = SessionLocal(); username = 'admin'; password = os.environ.get('ADMIN_PASSWORD', 'admin123'); hashed_password = pwd_context.hash(password); db_admin = models.Admin(username=username, hashed_password=hashed_password); db.add(db_admin); db.commit(); db.close(); print(f'Admin user created successfully');"

echo "Build completed successfully!"