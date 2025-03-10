#!/bin/bash

echo "Research Application Local Development Helper"
echo "=========================================="
echo ""
echo "This script helps you start the local development environment."
echo ""

# Function to check if a process is running on a port
function is_port_in_use() {
  lsof -i:"$1" > /dev/null
  return $?
}

echo "What would you like to do?"
echo "1. Start backend server"
echo "2. Start frontend development server"
echo "3. Start both backend and frontend"
echo "4. Initialize/reset database"
echo "5. Create admin user"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Starting backend server..."
        cd backend
        python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
        ;;
    2)
        echo "Starting frontend development server..."
        # Check if port 3000 is in use
        if is_port_in_use 3000; then
            echo "Port 3000 is already in use. Starting on port 3001 instead."
            cd frontend && PORT=3001 npm run start
        else
            cd frontend && npm run start
        fi
        ;;
    3)
        echo "Starting both backend and frontend..."
        # Start backend in the background
        cd backend
        python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
        BACKEND_PID=$!
        echo "Backend started with PID: $BACKEND_PID"
        
        cd ../frontend
        # Check if port 3000 is in use
        if is_port_in_use 3000; then
            echo "Port 3000 is already in use. Starting frontend on port 3001 instead."
            PORT=3001 npm run start
        else
            npm run start
        fi
        
        # When frontend is stopped, also stop the backend
        kill $BACKEND_PID
        ;;
    4)
        echo "Initializing/resetting database..."
        cd backend
        python3 -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"
        echo "Database initialized successfully."
        ;;
    5)
        echo "Creating admin user..."
        cd backend
        read -p "Enter admin username (default: admin): " admin_username
        admin_username=${admin_username:-admin}
        read -sp "Enter admin password (default: admin123): " admin_password
        admin_password=${admin_password:-admin123}
        echo ""
        
        python3 -c "from database import SessionLocal; import models; from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); db = SessionLocal(); username = '$admin_username'; password = '$admin_password'; hashed_password = pwd_context.hash(password); db_admin = models.Admin(username=username, hashed_password=hashed_password); db.add(db_admin); db.commit(); db.close(); print(f'Admin user created: {username}')"
        ;;
    *)
        echo "Invalid choice. Please run the script again and select a valid option."
        exit 1
        ;;
esac

echo ""
echo "Local development operation completed."
echo "Access your backend API at: http://localhost:8000"
echo "Access your frontend at: http://localhost:3000 or http://localhost:3001" 