export function getAppUrl(): string {
  const configured = process.env.NEXTAUTH_URL;
  if (configured && !configured.includes("localhost")) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return configured ?? "http://localhost:3000";
}
