# Vercel Deployment Guide

## Step-by-Step Instructions for Deploying to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- Your code pushed to GitHub

---

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push Code to GitHub

1. Initialize git (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - Plaza Performance Dashboard"
```

2. Create a new repository on GitHub

3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables

**IMPORTANT:** Add these environment variables before deploying:

1. In the project configuration page, scroll to **"Environment Variables"**
2. Add the following variables:

| Name | Value |
|------|-------|
| `VITE_TELEGRAM_BOT_TOKEN` | `8886521882:AAG7Z1ndAg_l8rqwzMAb76ff35Sj4kWWtjk` |
| `VITE_TELEGRAM_CHAT_ID` | `5831003572` |

3. Select **"Production"**, **"Preview"**, and **"Development"** for all variables

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **ranking-analysis** (or your preferred name)
- In which directory is your code located? **.**
- Want to override the settings? **N**

### Step 4: Add Environment Variables

```bash
vercel env add VITE_TELEGRAM_BOT_TOKEN
```
Enter value: `8886521882:AAG7Z1ndAg_l8rqwzMAb76ff35Sj4kWWtjk`

```bash
vercel env add VITE_TELEGRAM_CHAT_ID
```
Enter value: `5831003572`

### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Post-Deployment

### Verify Deployment

1. Visit your Vercel URL
2. Upload test Excel files
3. Check if Telegram messages are received

### Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

### Monitor Deployments

- View deployment logs in Vercel dashboard
- Check function logs for Telegram API calls
- Monitor build times and errors

---

## Troubleshooting

### Build Fails

**Issue**: Build fails with TypeScript errors
**Solution**: Run `npm run build` locally first to catch errors

### Environment Variables Not Working

**Issue**: Telegram messages not sending
**Solution**: 
1. Check environment variables in Vercel dashboard
2. Ensure variable names start with `VITE_`
3. Redeploy after adding variables

### Excel Upload Not Working

**Issue**: File upload fails
**Solution**: 
1. Check browser console for errors
2. Ensure file is .xlsx or .xls format
3. Check file size (Vercel has 4.5MB limit for serverless functions)

---

## Updating Your Deployment

### Push Updates

```bash
git add .
git commit -m "Your update message"
git push
```

Vercel will automatically deploy the changes.

### Manual Redeploy

1. Go to Vercel dashboard
2. Select your project
3. Click **"Deployments"**
4. Click **"..."** on latest deployment
5. Click **"Redeploy"**

---

## Important Notes

- ✅ Free tier includes: Unlimited deployments, 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic Git integration
- ⚠️ Don't commit `.env` file to GitHub (already in .gitignore)
- ⚠️ Always add environment variables in Vercel dashboard

---

## Support

For Vercel-specific issues, visit:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

For application issues, contact the developer.
