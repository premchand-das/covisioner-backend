import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("EMAIL_USER EXISTS:", Boolean(process.env.EMAIL_USER));
    console.log("EMAIL_PASS EXISTS:", Boolean(process.env.EMAIL_PASS));
    console.log("SENDING EMAIL TO:", to);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS env variables");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP VERIFIED");

    const info = await transporter.sendMail({
      from: `"CoVisioner Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT:", info.messageId);

    return info;
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

export default sendEmail;