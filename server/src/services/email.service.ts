import nodemailer from 'nodemailer';

// Create a transporter. 
// FOR DEV: We use Ethereal (fake SMTP).
// FOR PROD: Use Gmail, SendGrid, etc.
const createTransporter = async () => {
  // Generate a test account for development
  const testAccount = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });
};

const sendEmail = async (to: string, subject: string, text: string) => {
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: '"R2RSupport"<noreply@R2R.com>',
    to,
    subject,
    text,
  });

  console.log("Message sent: %s", info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

export default sendEmail;