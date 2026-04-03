const { Resend } = require("resend");
const { renderTemplate } = require("./emailTemplateService");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTemplatedEmail({ templateKey, to, variables }) {
  if (!to) return null;
  const rendered = await renderTemplate(templateKey, variables);

  return resend.emails.send({
    from: process.env.FROM_EMAIL || "no-reply@noumandevs.online",
    to,
    subject: rendered.subject,
    html: rendered.body,
  });
}

async function sendTestTemplatedEmail({ templateKey, to, variables }) {
  const rendered = await renderTemplate(templateKey, variables);
  return resend.emails.send({
    from: process.env.FROM_EMAIL || "no-reply@noumandevs.online",
    to,
    subject: `[Test] ${rendered.subject}`,
    html: rendered.body,
  });
}

module.exports = {
  sendTemplatedEmail,
  sendTestTemplatedEmail,
};
