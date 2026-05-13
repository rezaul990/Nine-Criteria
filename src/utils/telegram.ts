// Telegram notification utility

interface TangailReport {
  totalPlazas: number;
  previousYearSale: number;
  currentYearSale: number;
  growthDegrowthPercent: string;
  totalProfit: number;
  growthPlazas: number;
  degrowthPlazas: number;
  profitPlazas: number;
  lossPlazas: number;
  timestamp: string;
}

interface PlazaDetail {
  plaza: string;
  previousYearSale: number;
  currentYearSale: number;
  growthDegrowth: number;
  growthDegrowthPercent: string;
  profit: number;
  status: 'growth' | 'degrowth' | 'same';
  profitStatus: 'profit' | 'loss' | 'breakeven';
}

export const sendTangailReportToTelegram = async (report: TangailReport) => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  console.log('Telegram Bot Token:', botToken ? 'Found' : 'Not found');
  console.log('Telegram Chat ID:', chatId ? 'Found' : 'Not found');

  // Skip if credentials not configured
  if (!botToken || !chatId) {
    console.log('Telegram credentials not configured. Skipping notification.');
    return;
  }

  // Format numbers with color
  const formatNumber = (num: number) => {
    const formatted = num.toLocaleString();
    return num < 0 ? `<b><span class="tg-spoiler">🔴</span> ${formatted}</b>` : formatted;
  };

  const formatPercent = (percent: string) => {
    const isNegative = percent.startsWith('-');
    return isNegative ? `<b><span class="tg-spoiler">🔴</span> ${percent}</b>` : percent;
  };

  const message = `📊 <b>TANGAIL AREA REPORT</b>
━━━━━━━━━━━━━━━━━━━━━━

📅 <b>Date:</b> ${report.timestamp}
🏢 <b>Total Plazas:</b> ${report.totalPlazas}

💰 <b>SALES COMPARISON</b>
├ Previous Year: ${formatNumber(report.previousYearSale)} Tk
├ Current Year: ${formatNumber(report.currentYearSale)} Tk
└ Growth/Degrowth: ${formatPercent(report.growthDegrowthPercent)}

💵 <b>PROFIT ANALYSIS</b>
└ Total Profit: ${formatNumber(report.totalProfit)} Tk

📈 <b>PERFORMANCE METRICS</b>
├ ✅ Growth Plazas: ${report.growthPlazas}
├ ❌ Degrowth Plazas: ${report.degrowthPlazas}
├ 💚 Profit Plazas: ${report.profitPlazas}
└ 🔴 Loss Plazas: ${report.lossPlazas}

━━━━━━━━━━━━━━━━━━━━━━
<i>Auto-generated from Plaza Performance Dashboard</i>`;

  console.log('Sending Telegram message silently...');

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
          parse_mode: 'HTML',
        }),
      }
    );

    const responseData = await response.json();
    console.log('Telegram API Response:', responseData);

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', responseData);
    } else {
      console.log('Tangail report sent to Telegram successfully (silent mode)');
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

export const sendPlazaWiseReport = async (plazas: PlazaDetail[]) => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  // Skip if credentials not configured
  if (!botToken || !chatId) {
    console.log('Telegram credentials not configured. Skipping plaza-wise report.');
    return;
  }

  // Sort plazas by growth/degrowth percentage (descending)
  const sortedPlazas = [...plazas].sort((a, b) => {
    const aPercent = parseFloat(a.growthDegrowthPercent);
    const bPercent = parseFloat(b.growthDegrowthPercent);
    return bPercent - aPercent;
  });

  // Format numbers with red indicator for negative values
  const formatNumber = (num: number) => {
    const formatted = num.toLocaleString();
    if (num < 0) {
      return `<b><span class="tg-spoiler">🔴</span> ${formatted}</b>`;
    }
    return num > 0 ? `+${formatted}` : formatted;
  };

  let message = `📋 <b>TANGAIL AREA - PLAZA WISE REPORT</b>
━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  sortedPlazas.forEach((plaza, index) => {
    const statusIcon = plaza.status === 'growth' ? '📈' : plaza.status === 'degrowth' ? '📉' : '➖';
    const profitIcon = plaza.profitStatus === 'profit' ? '💚' : plaza.profitStatus === 'loss' ? '🔴' : '⚪';
    
    const growthText = plaza.growthDegrowth < 0 
      ? `<b><span class="tg-spoiler">🔴</span> ${plaza.growthDegrowth.toLocaleString()}</b> Tk (<b><span class="tg-spoiler">🔴</span> ${plaza.growthDegrowthPercent}</b>)`
      : `${formatNumber(plaza.growthDegrowth)} Tk (${plaza.growthDegrowthPercent})`;
    
    const profitText = plaza.profit < 0
      ? `<b><span class="tg-spoiler">🔴</span> ${plaza.profit.toLocaleString()}</b> Tk`
      : `${formatNumber(plaza.profit)} Tk`;

    message += `<b>${index + 1}. ${plaza.plaza}</b> ${statusIcon} ${profitIcon}\n`;
    message += `├ Prev Year: ${plaza.previousYearSale.toLocaleString()} Tk\n`;
    message += `├ Curr Year: ${plaza.currentYearSale.toLocaleString()} Tk\n`;
    message += `├ Growth: ${growthText}\n`;
    message += `└ Profit: ${profitText}\n\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📈 Growth | 📉 Degrowth | 💚 Profit | 🔴 Loss`;

  console.log('Sending plaza-wise report to Telegram (silent mode)...');

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
          parse_mode: 'HTML',
        }),
      }
    );

    const responseData = await response.json();
    console.log('Telegram Plaza-wise Report Response:', responseData);

    if (!response.ok) {
      console.error('Failed to send plaza-wise Telegram notification:', responseData);
    } else {
      console.log('Plaza-wise report sent to Telegram successfully (silent mode)');
    }
  } catch (error) {
    console.error('Error sending plaza-wise Telegram notification:', error);
  }
};
