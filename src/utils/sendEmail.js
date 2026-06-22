import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS");
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"CoVisioner" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("EMAIL SENT:", info.messageId);
  return info;
};

export default sendEmail;