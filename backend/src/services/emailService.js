import nodemailer from "nodemailer";
import config from "../config.js";

const transport = config.smtpHost
  ? nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  : null;

export async function sendOtp(email, code) {

  const subject = "Your Spotly login code";
  const text = `Use this code to sign in to Spotly: ${code}`;

  if (transport) {
    console.log(`Sending OTP email to ${email}`);
    await transport.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: email,
      subject,
      text,
    });
    return;
  }

}
