# Telegram Bot Setup Guide

This guide will help you set up automatic Telegram notifications for Tangail Area reports.

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Follow the instructions to create your bot
4. You'll receive a **Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Save this token securely

## Step 2: Get Your Chat ID

### Method 1: Using @userinfobot
1. Search for `@userinfobot` in Telegram
2. Start a chat with it
3. It will send you your Chat ID

### Method 2: Using your bot
1. Send any message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":` in the response
4. That number is your Chat ID

## Step 3: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   VITE_TELEGRAM_CHAT_ID=987654321
   ```

3. **Important**: Never commit `.env` to git (it's already in `.gitignore`)

## Step 4: Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Upload an Excel file with Tangail Area data
3. Select "Tangail Area" from the Area dropdown
4. You should receive a notification in Telegram!

## What Gets Sent?

When a user selects "Tangail Area", the bot automatically sends:
- Total number of plazas
- Average achievement percentage
- Total profit
- Growth/Degrowth plaza counts (if comparison data is available)
- Timestamp

## Troubleshooting

### Not receiving messages?
- Check that your bot token is correct
- Make sure you've started a chat with your bot (send `/start`)
- Verify your Chat ID is correct
- Check browser console for errors

### Security Note
- Bot tokens are sensitive! Keep them secret
- For production, consider using a backend API instead of exposing tokens in frontend
- Current implementation is suitable for internal/trusted use

## Production Deployment

For production, it's recommended to:
1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Consider using a backend API to hide credentials
3. Add rate limiting to prevent spam

## Disable Notifications

To disable Telegram notifications:
1. Remove or comment out the credentials in `.env`
2. The app will continue to work normally without sending notifications
