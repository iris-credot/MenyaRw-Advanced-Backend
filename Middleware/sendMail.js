const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Menya-Rwanda <onboarding@resend.dev>',
      to,
      subject,
      text,
      ...(html && { html }),
    });

    if (error) {
      console.error('❌ Email error:', error);
      throw new Error(error.message);
    }

    console.log(`📧 Email sent to ${to} — ${data.id}`);
    return data;

  } catch (err) {
    console.error('❌ Email failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;