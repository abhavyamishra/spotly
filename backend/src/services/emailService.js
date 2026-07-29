import nodemailer from "nodemailer";
import config from "../config.js";
import dns from "node:dns/promises";

console.log("========== SMTP CONFIG ==========");
console.log({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  user: config.smtpUser,
  from: config.smtpFrom,
  passLength: config.smtpPass ? config.smtpPass.length : 0,
});
console.log("=================================");

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

console.log("Transport created:", !!transport);

let verified = false;

async function verifyTransport() {
  if (!transport || verified) return;

  try {
    console.log("Resolving SMTP host...");

    const addresses = await dns.resolve4(config.smtpHost);
    console.log("SMTP DNS resolved:", addresses);

    console.log("Starting SMTP verification...");
    console.time("SMTP_VERIFY");

    await transport.verify();

    console.timeEnd("SMTP_VERIFY");
    verified = true;

    console.log("SMTP connection verified successfully.");
  } catch (err) {
    console.timeEnd("SMTP_VERIFY");
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
    console.log("----------------------------------");
    console.log(`Preparing OTP email for ${email}`);

    await verifyTransport();

    console.log("Calling sendMail()...");
    console.time("SEND_MAIL");

    const info = await transport.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: email,
      subject,
      text,
    });

    console.timeEnd("SEND_MAIL");

    console.log("Email sent successfully.");
    console.log("Message ID:", info.messageId);
    console.log("----------------------------------");

    return info;
  } catch (err) {
    console.timeEnd("SEND_MAIL");
    console.error("Failed to send OTP email:");
    console.error(err);
    throw err;
  }
}
