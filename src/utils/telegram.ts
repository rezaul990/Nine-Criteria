// Telegram notification utility

interface TangailReport {
  totalPlazas: number;
  avgAchievement: string;
  totalProfit: number;
  growthPlazas?: number;
  degrowthPlazas?: number;
  timestamp: string;
}

export const sendTangailReportToTelegram = async (report: TangailReport) => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  // Skip if credentials not configured
  if (!botToken || !chatId) {
    console.log('Telegram credentials not configured. Skipping notification.');
    return;
  }

  const message = `
📊 *Tangail Area Report*

📅 *Date:* ${report.timestamp}
🏢 *Total Plazas:* ${report.totalPlazas}
📈 *Avg Achievement:* ${report.avgAchievement}%
💰 *Total Profit:* ${report.totalProfit.toLocaleString()}

${report.growthPlazas !== undefined ? `✅ *Growth Plazas:* ${report.growthPlazas}` : ''}
${report.degrowthPlazas !== undefined ? `❌ *Degrowth Plazas:* ${report.degrowthPlazas}` : ''}

_Report generated automatically from Plaza Performance Dashboard_
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', await response.text());
    } else {
      console.log('Tangail report sent to Telegram successfully');
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};
