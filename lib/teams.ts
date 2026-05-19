import { getAppUrl } from "@/lib/app-url";
const APP_URL = getAppUrl();

async function post(card: object) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  }).catch((err) => console.error("[Teams webhook error]", err));
}

function adaptiveCard(body: object[], actions: object[] = []) {
  return {
    type: "message",
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.5",
        body,
        ...(actions.length ? { actions } : {}),
      },
    }],
  };
}

function header(title: string, subtitle: string, iconEmoji: string) {
  return [
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column", width: "auto",
          items: [{ type: "TextBlock", text: iconEmoji, size: "extraLarge" }],
        },
        {
          type: "Column", width: "stretch",
          items: [
            { type: "TextBlock", text: title, weight: "bolder", size: "medium", wrap: true },
            { type: "TextBlock", text: subtitle, isSubtle: true, size: "small", spacing: "none", wrap: true },
          ],
        },
      ],
    },
  ];
}

function factSet(facts: Array<{ title: string; value: string }>) {
  return { type: "FactSet", facts };
}

function separator() {
  return { type: "TextBlock", text: " ", separator: true, spacing: "small" };
}

function openUrlAction(label: string, url: string) {
  return { type: "Action.OpenUrl", title: label, url };
}

/* ─── Goal submission → manager ─── */
export function sendGoalSubmittedCard(employeeName: string, goalCount: number, sheetId: string) {
  const card = adaptiveCard(
    [
      ...header("Goal Sheet Submitted", "Awaiting your review and approval", "📋"),
      separator(),
      factSet([
        { title: "Employee", value: employeeName },
        { title: "Goals", value: `${goalCount} goal${goalCount !== 1 ? "s" : ""}` },
        { title: "Action", value: "Review → approve or return with feedback" },
      ]),
    ],
    [openUrlAction("Review Now →", `${APP_URL}/manager/approvals/${sheetId}`)],
  );
  return post(card);
}

/* ─── Goal approved → employee ─── */
export function sendGoalApprovedCard(employeeName: string, goalCount: number, sheetId: string) {
  const card = adaptiveCard(
    [
      ...header("Goal Sheet Approved ✓", "Goals are now locked and active", "🎯"),
      separator(),
      factSet([
        { title: "Employee", value: employeeName },
        { title: "Goals locked", value: `${goalCount}` },
        { title: "Next step", value: "Log quarterly actuals when your check-in window opens" },
      ]),
    ],
    [openUrlAction("View My Goals →", `${APP_URL}/employee/goals/${sheetId}`)],
  );
  return post(card);
}

/* ─── Goal returned → employee ─── */
export function sendGoalReturnedCard(employeeName: string, note: string, sheetId: string) {
  const card = adaptiveCard(
    [
      ...header("Goal Sheet Returned", "Manager has requested revisions", "↩️"),
      separator(),
      factSet([
        { title: "Employee", value: employeeName },
        { title: "Feedback", value: note.length > 120 ? note.slice(0, 117) + "…" : note },
      ]),
    ],
    [openUrlAction("Revise My Goals →", `${APP_URL}/employee/goals/${sheetId}`)],
  );
  return post(card);
}

/* ─── Shared goal pushed → channel (summary) ─── */
export function sendSharedGoalCard(assignerName: string, goalTitle: string, thrustArea: string, recipientCount: number) {
  const card = adaptiveCard(
    [
      ...header("Shared Goal Assigned", `Pushed to ${recipientCount} team member${recipientCount !== 1 ? "s" : ""}`, "🔗"),
      separator(),
      factSet([
        { title: "Assigned by", value: assignerName },
        { title: "Goal", value: goalTitle },
        { title: "Thrust area", value: thrustArea },
        { title: "Recipients", value: `${recipientCount} employee${recipientCount !== 1 ? "s" : ""}` },
      ]),
    ],
    [openUrlAction("View Shared Goals →", `${APP_URL}/manager/shared-goals`)],
  );
  return post(card);
}

/* ─── Check-in reminder → channel ─── */
export function sendCheckInReminderCard(quarter: string, deadline: string, pendingCount: number) {
  const card = adaptiveCard(
    [
      ...header(`${quarter} Check-in Due`, "Employees with pending actuals", "⏰"),
      separator(),
      factSet([
        { title: "Quarter", value: quarter },
        { title: "Deadline", value: deadline },
        { title: "Pending", value: `${pendingCount} employee${pendingCount !== 1 ? "s" : ""} haven't logged actuals` },
      ]),
    ],
    [openUrlAction("Manager Check-ins →", `${APP_URL}/manager/check-ins`)],
  );
  return post(card);
}

/* ─── Generic card (kept for backwards compat) ─── */
export async function sendTeamsCard({ title, body, actionUrl, actionLabel }: {
  title: string; body: string; actionUrl?: string; actionLabel?: string;
}) {
  const card = adaptiveCard(
    [
      ...header(title, body, "🔔"),
    ],
    actionUrl ? [openUrlAction(actionLabel ?? "Open →", actionUrl)] : [],
  );
  return post(card);
}
