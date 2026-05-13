# Ranking Analysis - Plaza Performance Dashboard

A React + TypeScript application for analyzing plaza performance metrics with automatic Telegram reporting for Tangail Area.

## Features

- 📊 ACH Growth Comparison between current and previous year
- 📈 Division and Area-wise performance analysis
- 💰 Profit/Loss tracking
- 📱 Automatic Telegram notifications with detailed reports
- 🎯 Growth/Degrowth analysis
- 📋 Plaza-wise detailed breakdown

## Tech Stack

- React 19
- TypeScript
- Vite
- XLSX (Excel file processing)
- Telegram Bot API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Ranking-Anlysis
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `VITE_TELEGRAM_BOT_TOKEN` and `VITE_TELEGRAM_CHAT_ID`

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables:
   - `VITE_TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `VITE_TELEGRAM_CHAT_ID`: Your Telegram chat ID
6. Click "Deploy"

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TELEGRAM_BOT_TOKEN` | Telegram Bot API token from @BotFather | Yes |
| `VITE_TELEGRAM_CHAT_ID` | Your Telegram chat ID | Yes |

## Usage

1. Upload **Current Year** Excel file
2. Upload **Previous Year** Excel file
3. View the comparison analysis
4. Automatic Telegram reports will be sent with:
   - Summary report with overall statistics
   - Plaza-wise detailed breakdown for Tangail Area

## Telegram Report Features

- 📊 Summary report with sales comparison and profit analysis
- 📋 Plaza-wise detailed report sorted by performance
- 🔴 Negative values highlighted in red with indicators
- 📈 Growth/Degrowth tracking
- 💚 Profit/Loss plaza counts

## Project Structure

```
Ranking-Anlysis/
├── src/
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.tsx             # Application entry point
│   └── utils/
│       └── telegram.ts      # Telegram integration
├── public/                  # Static assets
├── dist/                    # Production build
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment variables template
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Developer

Developed by **Md Rezaul Karim RCM**

## License

Private project

## Support

For issues or questions, contact the developer.
