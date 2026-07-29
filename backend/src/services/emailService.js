import sgMail from "@sendgrid/mail";
import config from "../config.js";

sgMail.setApiKey(config.smtpPass);

export async function sendOtp(email, code) {
  const msg = {
    to: email,
    from: config.smtpFrom,
    subject: "Your Spotly login code",
    text: `Use this code to sign in to Spotly: ${code}`,
  };

  try {
    console.log(`Sending OTP email to ${email}`);

    const response = await sgMail.send(msg);

    console.log("Email sent successfully.");
    console.log(response[0].statusCode);

    return response;
  } catch (err) {
    console.error("Failed to send email");

    if (err.response) {
      console.error(err.response.body);
    } else {
      console.error(err);
    }

    throw err;
  }
}