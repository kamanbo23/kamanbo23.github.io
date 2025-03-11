#!/bin/bash
set -e

echo "Starting application in $(pwd)..."
echo "Environment: DATABASE_URL=${DATABASE_URL:-sqlite:///app.db} (masked sensitive parts)"
echo "PORT: ${PORT:-8000}"

# Check if Railway environment
if [ -n "$RAILWAY_SERVICE_ID" ]; then
  echo "Detected Railway environment: $RAILWAY_SERVICE_ID"
  echo "Replica ID: $RAILWAY_REPLICA_ID"
fi

# Check if models.py exists and if so, create tables directly
if [ -f "models.py" ]; then
  echo "Setting up database tables..."
  
  # Try up to 3 times to create tables
  max_attempts=3
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts to create database tables..."
    
    if python -c "import os, sys; sys.path.append('.'); from database import engine; import models; models.Base.metadata.create_all(bind=engine); print('Database tables created successfully.')" ; then
      echo "Database tables created successfully!"
      break
    else
      echo "Failed to create database tables on attempt $attempt"
      if [ $attempt -eq $max_attempts ]; then
        echo "Maximum attempts reached. Continuing anyway..."
      else
        echo "Retrying in 2 seconds..."
        sleep 2
      fi
    fi
    
    attempt=$((attempt+1))
  done
else
  echo "models.py not found, skipping automatic table creation."
fi

# Pre-test the health endpoint
echo "Running a pre-flight test of the database connection..."
python -c "
import sys
sys.path.append('.')
try:
    from database import SessionLocal
    db = SessionLocal()
    db.execute('SELECT 1')
    db.close()
    print('Database connection pre-flight test: SUCCESS')
except Exception as e:
    print(f'Database connection pre-flight test: FAILED - {str(e)}')
    # Continue anyway, we'll handle this in the health check endpoint
"

# Start the application with the PORT environment variable
echo "Starting application on port ${PORT:-8000}..."
echo "$(date -u) - Application startup initiated"

# Add some time for the app to initialize before health checks start
sleep 2

# Use preload to speed up worker startup and share database connections
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout 120 \
  --preload \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --forwarded-allow-ips="*" 