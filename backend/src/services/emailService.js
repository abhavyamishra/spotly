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
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    })
  : null;

let verified = false;

async function verifyTransport() {
  if (!transport || verified) return;

  try {
    await transport.verify();
    verified = true;
    console.log("SMTP connection verified.");
  } catch (err) {
    console.error("SMTP verification failed:");
    console.error(err);
    throw err;
  }
}

export async function sendOtp(email, code) {
  if (!transport) {
    throw new Error("SMTP transport is not configured.");
  }

  const subject = "Your Spotly login code";
  const text = `Use this code to sign in to Spotly: ${code}`;

  try {
    await verifyTransport();

    console.log(`Sending OTP email to ${email}`);

    const info = await transport.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: email,
      subject,
      text,
    });

    console.log("Email sent successfully.");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (err) {
    console.error("Failed to send OTP email:");
    console.error(err);
    throw err;
  }
}
