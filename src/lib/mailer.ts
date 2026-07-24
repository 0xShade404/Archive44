/**
 * Minimal transactional email sender. Uses Resend if RESEND_API_KEY is configured;
 * otherwise logs the message so local/dev environments still work end-to-end.
 */
export async function sendMail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Archive44 <no-reply@archive44.com>";

  if (!apiKey) {
    console.log(`[mailer] RESEND_API_KEY not set — email not sent. To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    console.error(`[mailer] Failed to send email: ${res.status} ${await res.text()}`);
  }
}
