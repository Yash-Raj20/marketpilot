import nodemailer, { type Transporter } from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
}

let cachedTransporter: Transporter | null = null;

/**
 * Initializes or returns the cached Nodemailer transporter.
 * If SMTP credentials are provided in .env, uses them.
 * Otherwise, falls back to an Ethereal test account or console logger in development.
 */
async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
    const port = Number(SMTP_PORT || 587);
    // Port 465 requires secure: true (direct SSL). Port 587 requires secure: false (STARTTLS).
    const isSecure = port === 465 || (SMTP_SECURE === 'true' && port !== 587 && port !== 25);

    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: isSecure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
      }
    });

    console.log(`[EmailService] Configured Nodemailer with SMTP server: ${SMTP_HOST}:${SMTP_PORT || 587}`);
    return cachedTransporter;
  }

  // Fallback for local development if no SMTP credentials are configured yet
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`[EmailService] SMTP credentials not set. Using Ethereal test account: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not create Ethereal test account. Falling back to JSON transport (console logging).', err);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }
}

/**
 * Helper to wrap content with MarketPilot branded HTML layout
 */
function renderMarketPilotTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 24px 32px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #818cf8;
    }
    .content {
      padding: 32px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
    }
    .content h2 {
      color: #f8fafc;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .button-container {
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 8px;
    }
    .footer {
      padding: 20px 32px;
      background: #090d16;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    .divider {
      height: 1px;
      background: #1e293b;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">Market<span>Pilot</span> AI</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} MarketPilot AI. All rights reserved.</p>
      <p>This is an automated notification. If you did not request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generic email sending function using Nodemailer.
 * In the future, this can be swapped or augmented with a production provider
 * (such as Resend, Sendgrid, Postmark, AWS SES) without changing caller code.
 */
export async function sendEmail(options: SendMailOptions): Promise<{ messageId?: string; previewUrl?: string | false }> {
  try {
    const transporter = await getTransporter();
    const defaultFrom = process.env.SMTP_FROM || '"MarketPilot AI" <noreply@marketpilot.local>';

    const info = await transporter.sendMail({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text || options.subject,
      html: options.html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] ✉️  Preview URL: ${previewUrl}`);
    } else {
      console.log(`[EmailService] ✉️  Email sent to ${options.to} (${info.messageId || 'ID generated'})`);
    }

    return {
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${options.to}:`, error);
    // Don't throw fatal error to avoid disrupting client workflows if email is non-critical
    return { previewUrl: false };
  }
}

/**
 * Sends a welcome email upon user registration
 */
export async function sendWelcomeEmail(user: { email: string; name?: string }) {
  const recipientName = user.name || 'Trader';
  const html = renderMarketPilotTemplate(
    'Welcome to MarketPilot AI',
    `
      <h2>Welcome aboard, ${recipientName}! 🚀</h2>
      <p>Thank you for joining <strong>MarketPilot AI</strong> — your intelligent companion for market analysis, AI trade journaling, and portfolio risk management.</p>
      
      <p>Here is how you can get started quickly:</p>
      <ul>
        <li><strong>Live Market Overview:</strong> Monitor Indian market indices, gainers, losers, and 52-week highs.</li>
        <li><strong>AI Trade Journal:</strong> Record and reflect on your setups with risk-reward ratios and P&L tracking.</li>
        <li><strong>Personal Watchlist:</strong> Track key tickers and receive real-time sentiment cues.</li>
      </ul>

      <div class="button-container">
        <a href="${process.env.CORS_ORIGIN || 'https://marketpilot-rouge.vercel.app/'}" class="btn">Launch MarketPilot</a>
      </div>

      <div class="divider"></div>
      <p style="font-size: 13px; color: #94a3b8;">
        Need assistance or have feedback? Reply to this email or contact support. Happy trading!
      </p>
    `
  );

  return sendEmail({
    to: user.email,
    subject: 'Welcome to MarketPilot AI 🚀',
    text: `Welcome to MarketPilot AI, ${recipientName}! Visit your dashboard at ${process.env.CORS_ORIGIN || 'http://localhost:5173'} to get started.`,
    html
  });
}

/**
 * Sends a password reset notification / confirmation email
 */
export async function sendPasswordChangedEmail(user: { email: string; name?: string }) {
  const recipientName = user.name || 'Trader';
  const html = renderMarketPilotTemplate(
    'Security Alert: Password Changed',
    `
      <h2>Security Alert 🔒</h2>
      <p>Hello ${recipientName},</p>
      <p>The password for your MarketPilot AI account (<strong>${user.email}</strong>) has been successfully updated.</p>
      <p>If you made this change, you can safely disregard this email.</p>
      
      <div class="divider"></div>
      <p style="color: #f87171; font-size: 13px;">
        <strong>Didn't make this change?</strong> Please contact support immediately to secure your account.
      </p>
    `
  );

  return sendEmail({
    to: user.email,
    subject: 'Security Alert: Your MarketPilot AI password was changed',
    text: `Hello ${recipientName}, the password for your MarketPilot account (${user.email}) was successfully updated. If this wasn't you, contact support immediately.`,
    html
  });
}

/**
 * Sends a generic notification email
 */
export async function sendNotificationEmail(to: string, subject: string, message: string) {
  const html = renderMarketPilotTemplate(
    subject,
    `
      <h2>Notification</h2>
      <p>${message}</p>
    `
  );

  return sendEmail({
    to,
    subject,
    text: message,
    html
  });
}
