import nodemailer from 'nodemailer';

// Create a transporter. 
// FOR DEV: We use Ethereal (fake SMTP).
// FOR PROD: Use Gmail, SendGrid, etc.
const createTransporter = async () => {
  // Generate a test account for development
  // const testAccount = await nodemailer.createTestAccount();
  // Using Resend for production email sending
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
  return info;
};

export default sendEmail;