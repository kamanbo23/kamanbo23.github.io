FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/ /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Make start script executable
RUN chmod +x railway_start.sh

# Create tables at build time with extensive debugging information
RUN python -c "import os, sys; sys.path.append('.'); \
print('Python script starting...'); \
print(f'Working directory: {os.getcwd()}'); \
print(f'Files available: {os.listdir(\".\")[:10]}'); \
\
try: \
    print('Importing SQLAlchemy and text function...'); \
    from sqlalchemy import text; \
    print('Importing engine from database module...'); \
    from database import engine; \
    print(f'Engine URL: {engine.url}'); \
    print('Testing database connection...'); \
    with engine.connect() as conn: \
        result = conn.execute(text('SELECT 1')).scalar(); \
        print(f'Database connection test result: {result}'); \
    \
    print('Importing models...'); \
    import models; \
    print(f'Available models: {dir(models)[:10]}...'); \
    print('Creating tables...'); \
    models.Base.metadata.create_all(bind=engine); \
    print('Database tables created successfully!'); \
except Exception as e: \
    import traceback; \
    print(f'Error creating tables: {str(e)}', file=sys.stderr); \
    print('Traceback:', file=sys.stderr); \
    traceback.print_exc(); \
    sys.exit(1)"

# Expose the port
EXPOSE 8080

# Run the application
CMD ["./railway_start.sh"] 