# Deployment Guide

## Frontend Deployment (Vercel CLI)

### Prerequisites
- Install Vercel CLI: `npm i -g vercel`
- Vercel account

### Steps

1. **Navigate to frontend directory**
```bash
cd app/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Login to Vercel**
```bash
vercel login
```

4. **Deploy the project**
```bash
vercel --prod
```

5. **Set environment variables**
```bash
vercel env add REACT_APP_BACKEND_URL production
# Enter your Render backend URL when prompted
```

6. **Redeploy with env vars**
```bash
vercel --prod
```

## Backend Deployment (Render)

### Prerequisites
- GitHub account
- Render account

### Steps

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/kicknow.git
git push -u origin main
```

2. **Create Render Web Service**
- Go to [render.com](https://render.com)
- Click "New+" → "Web Service"
- Connect your GitHub repository
- Select the `kickclip/app/backend` directory
- Configure settings:
  - **Name**: kicknow-backend
  - **Environment**: Python 3
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
  - **Instance Type**: Free

3. **Set Environment Variables**
In your Render dashboard, add these environment variables:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-aB16172B5E04938C2C
JWT_SECRET=kicknow_jwt_secret_key_2026_secure
ADMIN_PASSWORD=Olivia1josh2
```

4. **Deploy**
- Click "Create Web Service"
- Render will automatically deploy on git push

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Update `MONGO_URL` in Render env vars

### Option 2: Render MongoDB
1. In Render, create "New+" → "MongoDB"
2. Use the provided connection string

## Post-Deployment Configuration

### 1. Update CORS Origins
In Render env vars, set:
```
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

### 2. Update Frontend API URL
The `REACT_APP_BACKEND_URL` env var should point to your Render backend:
```
https://your-backend-name.onrender.com
```

### 3. Test the Deployment
1. Visit your Vercel frontend URL
2. Try login/register functionality
3. Test VOD analysis feature

## Troubleshooting

### Common Issues

**Frontend can't reach backend**
- Check CORS origins in Render env vars
- Verify REACT_APP_BACKEND_URL is correct
- Check backend logs in Render dashboard

**Backend deployment fails**
- Verify requirements.txt has all dependencies
- Check start command format
- Review build logs in Render

**MongoDB connection issues**
- Verify connection string format
- Check IP whitelist (if using MongoDB Atlas)
- Ensure database name matches

### Useful Commands

**Check Vercel deployment**
```bash
vercel ls
vercel logs
```

**Redeploy frontend**
```bash
vercel --prod
```

**Check Render logs**
- Go to your service dashboard → Logs tab

## URLs After Deployment

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`
- **API Docs**: `https://your-backend-name.onrender.com/docs`

## Environment Variables Summary

### Frontend (Vercel)
```
REACT_APP_BACKEND_URL=https://your-backend-name.onrender.com
```

### Backend (Render)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
DB_NAME=test_database
CORS_ORIGINS=https://your-app-name.vercel.app
EMERGENT_LLM_KEY=sk-emergent-aB16172B5E04938C2C
JWT_SECRET_KEY=kicknow_jwt_secret_key_2026_secure
ADMIN_PASSWORD=Olivia1josh2
```
