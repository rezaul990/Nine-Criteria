// Vercel Serverless Function to send Telegram messages
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { botToken, chatId, message, parseMode } = req.body;

    console.log('Received request:', { botToken: botToken ? 'present' : 'missing', chatId, messageLength: message?.length });

    if (!botToken || !chatId || !message) {
      return res.status(400).json({ error: 'Missing required fields', received: { botToken: !!botToken, chatId: !!chatId, message: !!message } });
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    console.log('Sending to Telegram...');

    // Send message to Telegram
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode || 'HTML',
      }),
    });

    const data = await response.json();
    console.log('Telegram response:', data);

    if (!response.ok) {
      console.error('Telegram API error:', data);
      return res.status(response.status).json({ error: 'Failed to send message', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
