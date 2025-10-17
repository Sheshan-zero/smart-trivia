const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendOtpEmail(to, code) {
  const from = process.env.EMAIL_FROM || "no-reply@smarttrivia.local";
  const subject = "Your Smart Trivia OTP";
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif">
      <h2>Smart Trivia</h2>
      <p>Your one-time code is:</p>
      <p style="font-size:24px;letter-spacing:4px"><b>${code}</b></p>
      <p>This code expires in 10 minutes. If you didn’t request it, you can ignore this email.</p>
    </div>
  `;
  await transporter.sendMail({ from, to, subject, html });
}

module.exports = { sendOtpEmail };
