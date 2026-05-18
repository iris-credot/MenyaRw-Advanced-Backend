const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
});

const sendEmail = async (to, subject, body) => {
  try {
    const info = await transporter.sendMail({
      from: `"Menya-Rwanda" <${process.env.AUTH_EMAIL}>`,
      to,
      subject,
      text: body,
    });

    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('FULL EMAIL ERROR:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
