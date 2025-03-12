#!/bin/bash
set -e

echo "==================== RAILWAY APP STARTUP ===================="
echo "Starting application in $(pwd) at $(date -u)"
echo "Node: $(hostname)"

# Ensure PORT is correctly set - Railway seems to be setting it to 8080
export PORT="${PORT:-8080}"
echo "PORT environment variable is now set to: $PORT"

# Print environment information (masking sensitive data)
DB_URL_MASKED="$(echo $DATABASE_URL | sed 's/[:@\/].*/:***@***\/***/')"
echo "Environment variables:"
echo "- DATABASE_URL: ${DB_URL_MASKED:-not set}"
echo "- PORT: ${PORT} (will use this as binding port)"
echo "- RAILWAY_SERVICE_ID: ${RAILWAY_SERVICE_ID:-not in Railway environment}"
echo "- RAILWAY_REPLICA_ID: ${RAILWAY_REPLICA_ID:-not set}"

# Test network connectivity
echo "Network diagnostics:"
echo "- Hostname: $(hostname)"
echo "- IP addresses: $(hostname -I || echo "hostname -I not available")"
echo "- DNS resolution: $(nslookup google.com 2>&1 | grep -A2 "Name:" || echo "nslookup not available")"

# Check if the selected PORT is already in use
if command -v netstat &> /dev/null; then
  echo "- Port ${PORT} status: $(netstat -tuln | grep ${PORT} || echo "available (not in use)")"
elif command -v ss &> /dev/null; then
  echo "- Port ${PORT} status: $(ss -tuln | grep ${PORT} || echo "available (not in use)")"
else
  echo "- Port status check: No tools available (netstat/ss missing)"
fi

# Test Python environment
echo "Python environment:"
echo "- Python version: $(python --version 2>&1)"
echo "- Working directory: $(pwd)"
echo "- Python path: $PYTHONPATH"
echo "- Available packages:"
python -m pip list | grep -E 'sqlalchemy|fastapi|uvicorn|gunicorn|psycopg|asyncpg|alembic'

# Check if models.py exists and if so, create tables with retries
if [ -f "models.py" ]; then
  echo "Setting up database tables..."
  
  # Try up to 3 times to create tables
  max_attempts=3
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts to create database tables..."
    
    # Run the Python code with extensive error handling
    if python -c "
import os, sys, time
sys.path.append('.')

try:
    from database import engine, SessionLocal
    from sqlalchemy import text
    import models
    print('Database modules imported successfully')
    
    # Try to open a test connection first
    print('Testing database connection...')
    db = SessionLocal()
    db.execute(text('SELECT 1'))  # Use text() for proper SQL construction
    db.close()
    print('Database connection test successful')
    
    # Create tables
    print('Creating database tables...')
    models.Base.metadata.create_all(bind=engine)
    print('Database tables created successfully.')
except Exception as e:
    print(f'ERROR: {str(e)}', file=sys.stderr)
    sys.exit(1)
" ; then
      echo "✅ Database tables created successfully!"
      break
    else
      echo "❌ Failed to create database tables on attempt $attempt"
      if [ $attempt -eq $max_attempts ]; then
        echo "Maximum attempts reached. Continuing anyway..."
      else
        echo "Retrying in 5 seconds..."
        sleep 5
      fi
    fi
    
    attempt=$((attempt+1))
  done
else
  echo "models.py not found, skipping automatic table creation."
fi

# Pre-test the health endpoint
echo "Running a pre-flight test of the application health check..."
python -c "
import sys, os, time
sys.path.append('.')

try:
    print('Importing application modules...')
    # Force the PORT environment variable
    os.environ['PORT'] = '${PORT}'
    print(f'Using PORT={os.environ.get(\"PORT\")}')
    
    from sqlalchemy import text
    from database import SessionLocal
    import models
    
    # Test direct database connection first
    print('Testing direct database connection...')
    db = SessionLocal()
    result = db.execute(text('SELECT 1')).scalar()
    db.close()
    print(f'Database test result: {result}')
    
    # Now test the health endpoint
    from main import app
    from fastapi.testclient import TestClient
    
    print('Creating test client...')
    client = TestClient(app)
    
    print('Testing health endpoint...')
    response = client.get('/health')
    print(f'Health check response status: {response.status_code}')
    print(f'Health check response: {response.json()}')
    
    if response.status_code == 200:
        print('Health check endpoint test: SUCCESS')
        sys.exit(0)
    else:
        print('Health check endpoint test: FAILED - returned non-200 status')
        sys.exit(1)
except Exception as e:
    print(f'Health check pre-flight test: FAILED - {str(e)}')
    # Don't exit with error, let the application try to start anyway
" || echo "Health check pre-flight test failed, continuing anyway..."

# Start the application with the correct PORT environment variable
echo "Starting application on port ${PORT}..."
echo "$(date -u) - Application startup initiated"

# Add some time for the app to initialize before health checks start
sleep 2
echo "Executing Gunicorn with 4 workers, binding to port ${PORT}..."

# Use preload to speed up worker startup and share database connections
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app \
  --bind 0.0.0.0:${PORT} \
  --timeout 120 \
  --preload \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --forwarded-allow-ips="*" \
  --capture-output 