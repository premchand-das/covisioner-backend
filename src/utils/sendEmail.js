import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "CoVisioner <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("RESEND EMAIL ERROR:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log("EMAIL SENT:", data?.id);
  return data;
};

export default sendEmail;