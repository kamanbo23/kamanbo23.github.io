# Railway Backend Deployment Guide with Netlify Frontend

This guide will help you deploy your application's backend to Railway while using Netlify for the frontend.

## Prerequisites

1. A [Railway](https://railway.app/) account
2. Your frontend already deployed on [Netlify](https://www.netlify.com/)
3. [Railway CLI](https://docs.railway.app/develop/cli) installed (optional but recommended)

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

## Step 3: Deploy the Backend

You can deploy directly from GitHub:

1. Go to your project in the Railway dashboard
2. Click on "New" and select "GitHub Repo"
3. Find and select your repository
4. Railway will automatically detect the `railway.toml` configuration and deploy the backend service

Or deploy using the CLI:

```bash
# Deploy the current directory
railway up
```

## Step 4: Set Environment Variables

Required environment variables are already configured in the `railway.toml` file, but you must set these values in the Railway dashboard:

1. Go to your project in the Railway dashboard
2. Select the backend service
3. Go to "Variables"
4. Set the following variables:
   - `SECRET_KEY`: Generate a secure random key
   - `CORS_ORIGINS`: Set to your Netlify frontend URL (e.g., `https://your-app.netlify.app`)

## Step 5: Connect Frontend to Backend

1. Once your backend is deployed, Railway will provide you with a URL
2. In your Netlify dashboard, set up an environment variable for your frontend:
   - Go to your site dashboard
   - Navigate to "Site settings" → "Environment variables"
   - Add a variable named `REACT_APP_API_URL` with the value of your Railway backend URL

## Step 6: Verify Deployment

1. Access your frontend URL on Netlify to verify that it connects to the backend properly
2. You can check the backend health endpoint at `[your-backend-url]/health`

## Step 7: Database Migrations

If this is your first deployment, the migrations will run automatically thanks to the `railway_start.sh` script.

## Troubleshooting

- **CORS Issues**: Make sure your backend's `CORS_ORIGINS` environment variable includes your Netlify frontend URL
- **Database Connection Issues**: Make sure Railway properly linked your PostgreSQL database to your backend service
- **Deployment Failures**: Check the deployment logs in the Railway dashboard for specific errors

## Local Development

For local development, you can still use the Docker Compose setup:

```bash
docker-compose up
```

When working locally, make sure to:
1. Set your frontend's `.env` to point to your local backend (`http://localhost:8000`)
2. Run the backend locally with `python -m uvicorn main:app --reload` 