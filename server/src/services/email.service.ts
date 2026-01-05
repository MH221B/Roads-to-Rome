import nodemailer from 'nodemailer';

// Create a transporter using Gmail for both development and production
const createTransporter = async () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: '"R2RSupport"<noreply@R2R.com>',
    to,
    subject,
    text,
    html,
  });

  console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
