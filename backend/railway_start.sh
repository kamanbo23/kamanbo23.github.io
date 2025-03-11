#!/bin/bash
set -e

# Check if models.py exists and if so, create tables directly
if [ -f "models.py" ]; then
  echo "Setting up database tables..."
  python -c "import models; from database import engine; models.Base.metadata.create_all(bind=engine); print('Database tables created successfully.')"
else
  echo "models.py not found, skipping automatic table creation."
fi

# Start the application
echo "Starting application..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 