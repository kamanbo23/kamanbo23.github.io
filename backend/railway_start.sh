#!/bin/bash
set -e

echo "Running database migrations..."
python -m alembic upgrade head

echo "Starting application..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 