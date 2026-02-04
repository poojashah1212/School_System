const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: '"School System" <no-reply@school.com>',
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email server connection verified successfully");
    return true;
  } catch (error) {
    console.error("Email server connection failed:", error);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConnection
};
