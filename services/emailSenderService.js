const { BrevoClient } = require("@getbrevo/brevo");
const { renderTemplate } = require("./emailTemplateService");

async function sendMail({ to, subject, html, sender }) {
  const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

  const recipients = Array.isArray(to)
    ? to.map((email) => ({ email }))
    : [{ email: to }];

  await client.transactionalEmails.sendTransacEmail({
    sender: sender || {
      email: process.env.BREVO_SENDER_EMAIL || "contact@noumandevs.online",
      name: "StitchFlow",
    },
    to: recipients,
    subject,
    htmlContent: html,
  });
}

function getDefaultSender() {
  return {
    email: process.env.FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || "no-reply@noumandevs.online",
    name: process.env.SENDER_NAME || "StitchFlow",
  };
}

async function sendTemplatedEmail({ templateKey, to, variables }) {
  if (!to) return null;
  const rendered = await renderTemplate(templateKey, variables);

  return sendMail({
    to,
    subject: rendered.subject,
    html: rendered.body,
    sender: getDefaultSender(),
  });
}

async function sendTestTemplatedEmail({ templateKey, to, variables }) {
  const rendered = await renderTemplate(templateKey, variables);

  return sendMail({
    to,
    subject: `[Test] ${rendered.subject}`,
    html: rendered.body,
    sender: getDefaultSender(),
  });
}

module.exports = {
  sendMail,
  sendTemplatedEmail,
  sendTestTemplatedEmail,
};
