const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

/**
 * Send an email using Mailgun
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content (optional)
 * @param {string} [options.html] - HTML content (optional)
 * @throws {Error} If email sending fails
 * @returns {Promise<Object>} Mailgun API response
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: process.env.MAILGUN_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully:", {
      to,
      subject,
      messageId: response.id,
    });

    return response;
  } catch (error) {
    console.error("Failed to send email:", {
      to,
      subject,
      error: error.message,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = sendEmail;
