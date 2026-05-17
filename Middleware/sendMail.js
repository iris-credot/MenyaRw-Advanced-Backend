const nodemailer = require('nodemailer');

// ─── Create transporter ONCE at startup ───────────────────────────────────────
// Reused across all email sends — no new connection per email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Verify SMTP connection at startup ────────────────────────────────────────
// Logs a clear message so you know immediately if email config is broken
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP server ready to send emails');
  }
});

// ─── Send email ───────────────────────────────────────────────────────────────
// Supports both plain text and optional HTML — useful for the guide welcome email
const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: `"Menya Rwanda" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    ...(html && { html }),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to} — ${info.messageId}`);
  return info;
};

module.exports = sendEmail;