import { Resend } from "resend";
import { getAppUrl } from "@/lib/app-url";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "AtomQuest <noreply@atomberg.garcade.in>";
const TEST_TO = "omsharma050322@gmail.com";
const APP_URL = getAppUrl();

/* ── Base template ── */
function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#1a1a14;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
        <span style="font-size:20px;font-weight:700;color:#f5f2ea;letter-spacing:-0.5px;">AtomQuest</span>
        <span style="font-size:11px;color:#c8a84b;background:#2a2a1e;border-radius:99px;padding:2px 10px;margin-left:10px;vertical-align:middle;">by Atomberg</span>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e8e4d8;border-right:1px solid #e8e4d8;">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f0ece0;border-radius:0 0 12px 12px;padding:18px 32px;border:1px solid #e8e4d8;border-top:none;text-align:center;">
        <span style="font-size:11px;color:#888;line-height:1.6;">
          AtomQuest · Atomberg Technologies · This is an automated notification.<br/>
          If you have questions, reach out to your admin.
        </span>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a14;letter-spacing:-0.4px;">${text}</h1>`;
}

function para(text: string) {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#444;">${text}</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e8e4d8;margin:24px 0;"/>`;
}

function cta(label: string, url: string) {
  return `<div style="margin:24px 0 8px;">
    <a href="${url}" style="display:inline-block;background:#c8a84b;color:#1a1a14;font-weight:700;font-size:14px;padding:12px 28px;border-radius:99px;text-decoration:none;letter-spacing:0.01em;">${label} →</a>
  </div>`;
}

function badge(label: string, color = "#c8a84b", bg = "#fdf8ec") {
  return `<span style="display:inline-block;background:${bg};color:${color};border:1px solid ${color}33;font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px;letter-spacing:0.04em;text-transform:uppercase;">${label}</span>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:12px;color:#888;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#1a1a14;font-weight:500;">${value}</td>
  </tr>`;
}

/* ── Core sender ── */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[Email skipped — no RESEND_API_KEY] To: ${to} | ${subject}`);
    return;
  }
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error("[Resend error]", error);
  else console.log("[Email sent]", data?.id, "→", to);
}

/* ════════════════════════════════════════════════
   GOAL LIFECYCLE
════════════════════════════════════════════════ */

export function goalSubmittedEmail(employeeName: string, managerEmail: string, managerName = "Manager") {
  const html = baseTemplate("Goal Sheet Submitted", `
    ${heading("Goal sheet awaiting your review")}
    ${para(`Hi ${managerName},`)}
    ${para(`<strong>${employeeName}</strong> has submitted their goal sheet and it's waiting for your approval.`)}
    ${divider()}
    ${cta("Review Goal Sheet", `${APP_URL}/manager/approvals`)}
    ${para(`<span style="font-size:12px;color:#888;">You can approve it directly or return it with feedback.</span>`)}
  `);
  return sendEmail(managerEmail, `${employeeName} submitted their goal sheet`, html);
}

export function goalApprovedEmail(employeeEmail: string, employeeName = "there") {
  const html = baseTemplate("Goal Sheet Approved", `
    ${heading("Your goal sheet has been approved 🎯")}
    ${para(`Hi ${employeeName},`)}
    ${para(`Great news — your manager has approved your goal sheet. Your goals are now <strong>locked and active</strong> for the quarter.`)}
    ${divider()}
    ${cta("View My Goals", `${APP_URL}/employee/goals`)}
    ${para(`<span style="font-size:12px;color:#888;">Remember to log check-in actuals each quarter.</span>`)}
  `);
  return sendEmail(employeeEmail, "Your goal sheet has been approved", html);
}

export function goalReturnedEmail(employeeEmail: string, employeeName = "there", note: string) {
  const html = baseTemplate("Goal Sheet Returned", `
    ${heading("Your goal sheet needs revision")}
    ${para(`Hi ${employeeName},`)}
    ${para("Your manager has reviewed your goal sheet and returned it with the following feedback:")}
    <div style="background:#fdf8f0;border-left:3px solid #c8a84b;padding:14px 18px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;color:#444;line-height:1.6;font-style:italic;">"${note}"</p>
    </div>
    ${cta("Revise My Goals", `${APP_URL}/employee/goals`)}
  `);
  return sendEmail(employeeEmail, "Your goal sheet has been returned for revision", html);
}

export function goalUnlockedEmail(employeeEmail: string, employeeName = "there") {
  const html = baseTemplate("Goal Unlocked", `
    ${heading("A goal has been unlocked")}
    ${para(`Hi ${employeeName},`)}
    ${para("An admin has unlocked one of your goals. You can now edit it and resubmit for approval.")}
    ${cta("View My Goals", `${APP_URL}/employee/goals`)}
  `);
  return sendEmail(employeeEmail, "One of your goals has been unlocked", html);
}

/* ════════════════════════════════════════════════
   CHECK-IN & SCORING
════════════════════════════════════════════════ */

export function checkInReminderEmail(employeeEmail: string, employeeName = "there", quarter: string, deadline: string) {
  const html = baseTemplate("Check-in Reminder", `
    ${heading(`${quarter} check-in is due`)}
    ${para(`Hi ${employeeName},`)}
    ${para(`Don't forget to log your <strong>${quarter}</strong> actuals before the deadline.`)}
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9f7f1;border-radius:8px;padding:4px 0;margin:0 0 20px;">
      ${infoRow("Quarter", quarter)}
      ${infoRow("Deadline", deadline)}
    </table>
    ${cta("Log Check-in", `${APP_URL}/employee/check-ins/${quarter.toLowerCase()}`)}
  `);
  return sendEmail(employeeEmail, `Reminder: ${quarter} check-in due ${deadline}`, html);
}

export function scorePublishedEmail(employeeEmail: string, employeeName = "there", quarter: string, score: string) {
  const html = baseTemplate("Score Published", `
    ${heading(`Your ${quarter} score is ready`)}
    ${para(`Hi ${employeeName},`)}
    ${para(`Your <strong>${quarter}</strong> performance score has been computed.`)}
    <div style="text-align:center;margin:24px 0;">
      <span style="font-size:48px;font-weight:700;color:#c8a84b;">${score}</span>
      <div style="font-size:12px;color:#888;margin-top:4px;letter-spacing:0.06em;text-transform:uppercase;">${quarter} composite score</div>
    </div>
    ${cta("View Full Report", `${APP_URL}/employee/goals`)}
  `);
  return sendEmail(employeeEmail, `Your ${quarter} score: ${score}`, html);
}

/* ════════════════════════════════════════════════
   ESCALATION
════════════════════════════════════════════════ */

export function escalationEmail(to: string, message: string, actionUrl = `${APP_URL}/manager/approvals`) {
  const html = baseTemplate("Action Required", `
    ${badge("Escalation", "#c0392b", "#fdf0ee")}
    <div style="height:16px;"></div>
    ${heading("Action Required")}
    ${para(message)}
    ${cta("Take Action", actionUrl)}
  `);
  return sendEmail(to, "Action Required: AtomQuest Escalation", html);
}

/* ════════════════════════════════════════════════
   USER MANAGEMENT
════════════════════════════════════════════════ */

export function welcomeEmail(userEmail: string, userName: string, role: string) {
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const html = baseTemplate("Welcome to AtomQuest", `
    ${heading(`Welcome to AtomQuest, ${userName}!`)}
    ${para("Your account is ready. You&rsquo;ve been added as a <strong>" + roleLabel + "</strong> on the Atomberg OKR portal.")}
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9f7f1;border-radius:8px;padding:4px 0;margin:0 0 20px;">
      ${infoRow("Email", userEmail)}
      ${infoRow("Role", roleLabel)}
    </table>
    ${para("Sign in with the password you set during registration. You can change it anytime from your profile settings.")}
    ${cta("Sign In Now", `${APP_URL}/login`)}
    ${divider()}
    ${para(`<span style="font-size:12px;color:#888;">If you didn&rsquo;t create this account, contact your admin immediately.</span>`)}
  `);
  return sendEmail(userEmail, "Welcome to AtomQuest — your account is ready", html);
}

export function passwordResetEmail(userEmail: string, userName = "there", resetToken: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const html = baseTemplate("Reset Your Password", `
    ${heading("Reset your password")}
    ${para(`Hi ${userName},`)}
    ${para("We received a request to reset your AtomQuest password. Click the button below — this link expires in <strong>1 hour</strong>.")}
    ${cta("Reset Password", resetUrl)}
    ${divider()}
    ${para(`<span style="font-size:12px;color:#888;">If you didn't request this, ignore this email. Your password won't change.</span>`)}
    ${para(`<span style="font-size:12px;color:#888;">Or copy this URL: <a href="${resetUrl}" style="color:#c8a84b;">${resetUrl}</a></span>`)}
  `);
  return sendEmail(userEmail, "Reset your AtomQuest password", html);
}

export function passwordChangedEmail(userEmail: string, userName = "there") {
  const html = baseTemplate("Password Changed", `
    ${heading("Password changed successfully")}
    ${para(`Hi ${userName},`)}
    ${para("Your AtomQuest password was just changed. If you made this change, no action needed.")}
    ${divider()}
    ${para(`<span style="font-size:12px;color:#888;">If you didn't change your password, contact your admin immediately.</span>`)}
    ${cta("Sign In", `${APP_URL}/login`)}
  `);
  return sendEmail(userEmail, "Your AtomQuest password has been changed", html);
}

export function cycleOpenedEmail(userEmail: string, userName = "there", cycleLabel: string, deadline: string) {
  const html = baseTemplate("New Cycle Started", `
    ${heading(`${cycleLabel} is now open`)}
    ${para(`Hi ${userName},`)}
    ${para(`A new goal-setting cycle has started. Please set your goals and submit them for approval before the deadline.`)}
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9f7f1;border-radius:8px;padding:4px 0;margin:0 0 20px;">
      ${infoRow("Cycle", cycleLabel)}
      ${infoRow("Submission deadline", deadline)}
    </table>
    ${cta("Set My Goals", `${APP_URL}/employee/goals/new`)}
  `);
  return sendEmail(userEmail, `${cycleLabel} goal cycle is now open`, html);
}

export function managerInviteEmail(toEmail: string, toName: string, managerName: string, inviteUrl: string) {
  const html = baseTemplate("You're invited to AtomQuest", `
    ${heading(`${managerName} invited you to AtomQuest`)}
    ${toName ? para(`Hi ${toName},`) : ""}
    ${para(`<strong>${managerName}</strong> has invited you to join AtomQuest, Atomberg&rsquo;s OKR portal. Click below to create your account — you&rsquo;ll be automatically added to their team.`)}
    ${divider()}
    ${cta("Join AtomQuest", inviteUrl)}
    ${para(`<span style="font-size:12px;color:#888;">This invite link is tied to ${managerName}. If you weren&rsquo;t expecting this, you can safely ignore it.</span>`)}
  `);
  return sendEmail(toEmail, `${managerName} invited you to AtomQuest`, html);
}

export function bulkInviteEmail(
  toEmail: string,
  toName: string,
  inviterName: string,
  signupUrl: string,
) {
  const greeting = toName ? `Hi ${toName},` : `Hi,`;
  const html = baseTemplate("You're invited to AtomQuest", `
    ${heading(`${inviterName} invited you to AtomQuest`)}
    ${para(greeting)}
    ${para(`<strong>${inviterName}</strong> has invited you to join AtomQuest, Atomberg&rsquo;s OKR portal. Click below to create your account — your email is pre-filled and you&rsquo;ll be automatically added to <strong>${inviterName}&rsquo;s</strong> team.`)}
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9f7f1;border-radius:8px;padding:4px 0;margin:0 0 20px;">
      ${infoRow("Your email", toEmail)}
      ${infoRow("Reporting to", inviterName)}
    </table>
    ${cta("Set up my account", signupUrl)}
    ${para(`<span style="font-size:12px;color:#888;">You&rsquo;ll choose your own password during signup. The link above opens a signup form with your email pre-filled.</span>`)}
    ${divider()}
    ${para(`<span style="font-size:12px;color:#888;">If you weren&rsquo;t expecting this, you can safely ignore it — no account is created until you click above.</span>`)}
  `);
  return sendEmail(toEmail, `${inviterName} invited you to AtomQuest`, html);
}
