# 🚀 MUSASHI Deployment Guide

## Quick Setup (5 minutes)

Your frontend is already deployed on Vercel. Now we need to deploy the backend.

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub

### 1.2 Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose **VittorioC13/musashi**
4. Railway will ask which folder - select **backend**
5. Click "Deploy"

### 1.3 Configure Environment Variables
After deployment starts:
1. Go to your Railway project
2. Click "Variables" tab
3. Add these variables:
   ```
   PORT=3001
   FRONTEND_URL=https://musashi-three.vercel.app
   ```
4. Click "Deploy" to restart with new variables

### 1.4 Get Your Backend URL
1. In Railway dashboard, click "Settings"
2. Click "Generate Domain"
3. Copy the URL (something like: `https://musashi-backend-production-xxxx.up.railway.app`)

---

## Step 2: Connect Frontend to Backend

### 2.1 Update Vercel Environment Variable
1. Go to https://vercel.com/dashboard
2. Select your **musashi** project
3. Go to "Settings" → "Environment Variables"
4. Add new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-railway-url.railway.app/api` (your Railway URL from step 1.4)
   - **Environment:** Production, Preview, Development (select all)
5. Click "Save"

### 2.2 Redeploy Frontend
1. Go to "Deployments" tab
2. Click the three dots (...) on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete (~1 minute)

---

## Step 3: Test Your Live App

1. Visit your Vercel URL: https://musashi-three.vercel.app
2. You should see:
   - ✅ Markets loading
   - ✅ Price charts showing
   - ✅ Real-time updates working
   - ✅ Live indicator showing green

---

## 🎯 Final URLs

- **Frontend:** https://musashi-three.vercel.app
- **Backend API:** https://your-backend.railway.app
- **GitHub Repo:** https://github.com/VittorioC13/musashi

---

## 🐛 Troubleshooting

### Markets not loading?
- Check Railway logs: Railway Dashboard → View Logs
- Verify FRONTEND_URL is set correctly in Railway
- Verify VITE_API_URL is set correctly in Vercel

### Real-time updates not working?
- Check browser console for errors
- SSE endpoint: `https://your-backend.railway.app/api/realtime/updates`
- Test in browser - should show connection message

### Backend not starting?
- Check Railway build logs
- Verify all dependencies installed
- Check PORT is set to 3001 (or let Railway assign automatically)

---

## 📊 What's Running

**Vercel (Frontend):**
- React app
- Static files
- Client-side routing

**Railway (Backend):**
- Express API server
- SQLite database (in-memory)
- Bot trading simulation
- SSE for real-time updates

---

## 🔄 Making Updates

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel auto-deploys frontend
4. Railway auto-deploys backend

Both will automatically rebuild and deploy! 🎉
