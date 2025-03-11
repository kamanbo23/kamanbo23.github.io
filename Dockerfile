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

# Create tables at build time
RUN python -c "import os, sys; sys.path.append('.'); from database import engine; import models; models.Base.metadata.create_all(bind=engine); print('Database tables created successfully!')"

# Expose the port
EXPOSE 8000

# Run the application
CMD ["./railway_start.sh"] 