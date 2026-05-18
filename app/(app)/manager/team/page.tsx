import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Icon } from "@/components/app/ui";
import { TeamInviteTools } from "./TeamInviteTools";
import { TeamTableClient } from "./TeamTableClient";

type Member = {
  id: string; name: string; email: string;
  goalSheets: { status: string; goals: { thrustArea: string; achievements: { computedScore: number | null }[] }[]; cycle: { year: number; phase: string } }[];
};

const DEMO_TEAM: Member[] = [
  { id: "m1", name: "Anika Sharma",  email: "anika@atomberg.com",  goalSheets: [{ status: "APPROVED",  goals: [{ thrustArea: "Engineering", achievements: [{ computedScore: 1.12 }] }, { thrustArea: "Quality", achievements: [{ computedScore: 1.13 }] }, { thrustArea: "People", achievements: [{ computedScore: 0.98 }] }], cycle: { year: 2026, phase: "GOAL_SETTING" } }] },
  { id: "m2", name: "Karan Verma",   email: "karan@atomberg.com",  goalSheets: [{ status: "RETURNED",  goals: [{ thrustArea: "Engineering", achievements: [{ computedScore: null }] }, { thrustArea: "Operations", achievements: [{ computedScore: null }] }], cycle: { year: 2026, phase: "GOAL_SETTING" } }] },
  { id: "m3", name: "Devika Pillai", email: "devika@atomberg.com", goalSheets: [{ status: "APPROVED",  goals: [{ thrustArea: "Quality", achievements: [{ computedScore: 1.21 }] }, { thrustArea: "Engineering", achievements: [{ computedScore: 1.05 }] }], cycle: { year: 2026, phase: "GOAL_SETTING" } }] },
  { id: "m4", name: "Hiren Thakur",  email: "hiren@atomberg.com",  goalSheets: [{ status: "DRAFT",     goals: [{ thrustArea: "Engineering", achievements: [] }], cycle: { year: 2026, phase: "GOAL_SETTING" } }] },
  { id: "m5", name: "Mira Kapoor",   email: "mira@atomberg.com",   goalSheets: [{ status: "SUBMITTED", goals: [{ thrustArea: "Product", achievements: [] }, { thrustArea: "People", achievements: [] }], cycle: { year: 2026, phase: "GOAL_SETTING" } }] },
  { id: "m6", name: "Sahil Bose",    email: "sahil@atomberg.com",  goalSheets: [{ status: "APPROVED",  goals: [{ thrustArea: "Engineering", achievements: [{ computedScore: 0.88 }] }, { thrustArea: "Quality", achievements: [{ computedScore: 0.92 }] }], cycle: { year: 2026, phase: "GOAL_SETTING" } }] },
];

export default async function TeamPage() {
  const session = await auth();
  if (!session) return null;

  let team: Member[] = DEMO_TEAM;
  try {
    const dbTeam = await db.user.findMany({
      where: { managerId: session.user.id },
      include: {
        goalSheets: {
          include: { goals: { include: { achievements: true } }, cycle: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
    if (dbTeam.length > 0) team = dbTeam;
  } catch {}

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="manager · team"
        title="My team."
        lede={`${team.length} direct report${team.length !== 1 ? "s" : ""} · click any row to open their goal sheet`}
        actions={
          <button className="btn-secondary"><Icon name="filter" size={14} /> Filter</button>
        }
      />

      <Panel title="Team overview" sub="All direct reports and their current goal sheet status" noPadding>
        <TeamTableClient team={team} />
      </Panel>

      <TeamInviteTools />
    </div>
  );
}
