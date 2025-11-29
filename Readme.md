# TonUP App - Earn TON Crypto

A complete Telegram Web App for earning TON cryptocurrency through tasks and referrals.

## Features

- 🎯 Task Management System
- 👥 Referral Program (100% commission)
- 💰 TON/GOLD Exchange System
- 📊 Real-time Statistics
- 🛡️ Cloudflare Protection
- 🗄️ Neon PostgreSQL Database
- ☁️ Netlify Hosting

## Setup Instructions

### 1. Database Setup (Neon)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project `tonup-app`
3. Run the SQL schema from `database-schema.sql`
4. Copy connection string

### 2. Netlify Deployment
1. Fork this repository
2. Connect to Netlify
3. Add environment variables:
   - `DATABASE_URL`: Your Neon connection string
   - `TELEGRAM_BOT_TOKEN`: Your bot token
   - `TELEGRAM_BOT_USERNAME`: Your bot username

### 3. Cloudflare Protection
1. Add your domain to Cloudflare
2. Update nameservers
3. Enable security features

### 4. Telegram Bot
1. Create bot via @BotFather
2. Set webhook to your Netlify URL
3. Configure Telegram Web App

## File Structure
