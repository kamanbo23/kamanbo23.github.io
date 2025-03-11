# Railway Deployment Guide

This guide will help you deploy your application to Railway.

## Prerequisites

1. A [Railway](https://railway.app/) account
2. [Railway CLI](https://docs.railway.app/develop/cli) installed (optional but recommended)

## Step 1: Initialize Your Railway Project

```bash
# Login to Railway
railway login

# Initialize project (if not done through the web interface)
railway init
```

## Step 2: Add a PostgreSQL Database

1. Go to your project in the Railway dashboard
2. Click on "New" and select "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL database for your project

## Step 3: Deploy the Project

You can deploy directly from GitHub:

1. Go to your project in the Railway dashboard
2. Click on "New" and select "GitHub Repo"
3. Find and select your repository
4. Railway will automatically detect the `railway.toml` configuration and deploy both backend and frontend services

Or deploy using the CLI:

```bash
# Deploy the current directory
railway up
```

## Step 4: Set Environment Variables

Required environment variables are already configured in the `railway.toml` file, but you should set a secure `SECRET_KEY` in the Railway dashboard:

1. Go to your project in the Railway dashboard
2. Select the backend service
3. Go to "Variables"
4. Add a secure value for `SECRET_KEY`

## Step 5: Verify Deployment

1. Once deployed, Railway will provide you with a URL for each service
2. Access the frontend URL to verify that your application is working correctly
3. You can check the backend health endpoint at `[your-backend-url]/health`

## Step 6: Database Migrations

If this is your first deployment, you need to run database migrations:

```bash
# Connect to your backend service
railway connect

# Run migrations (inside the container)
cd /app
python -m alembic upgrade head
```

Or you can add a custom start command in the Railway dashboard to run migrations on each deployment.

## Troubleshooting

- **Database Connection Issues**: Make sure Railway properly linked your PostgreSQL database to your backend service
- **Frontend API Connection**: Verify the `REACT_APP_API_URL` is correctly set to your backend service URL
- **Deployment Failures**: Check the deployment logs in the Railway dashboard for specific errors

## Local Development

For local development, you can still use the Docker Compose setup:

```bash
docker-compose up
``` 