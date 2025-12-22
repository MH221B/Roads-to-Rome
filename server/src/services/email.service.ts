import nodemailer from 'nodemailer';

// Create a transporter. 
// FOR DEV: We use Ethereal (fake SMTP).
// FOR PROD: Use Gmail, SendGrid, etc.
const createTransporter = async () => {
  // Generate a test account for development
  // const testAccount = await nodemailer.createTestAccount();
  // Using Resend for production email sending
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    // Development transporter using Ethereal
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
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
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  else{
    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};

export default sendEmail;