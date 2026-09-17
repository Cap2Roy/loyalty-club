import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeTier } from "@/lib/loyalty";
import AdjustPointsForm from "@/components/AdjustPointsForm";

export const metadata = { title: "Members" };

export default async function BizMembersPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { program: true },
  });
  if (!business) notFound();
  const program = business.program;
  const memberships = await prisma.membership.findMany({
    where: { businessId },
    orderBy: { joinedAt: "asc" },
    include: { user: true },
  });

  return (
    <div className="card">
      <h2>Members ({memberships.length})</h2>
      {memberships.length === 0 ? (
        <p className="empty">No members have joined yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>{program?.pointsName ?? "Points"}</th>
              <th>Lifetime spend</th>
              <th>Tier</th>
              <th>Joined</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id}>
                <td>{m.user.email}</td>
                <td>{m.points}</td>
                <td>{program?.currency ?? "USD"} {m.lifetimeSpend.toFixed(2)}</td>
                <td>
                  <span className="badge">{computeTier(program ?? { tierNames: "Member", tierThresholds: "" }, m.lifetimeSpend).name}</span>
                </td>
                <td>{m.joinedAt.toLocaleDateString()}</td>
                <td>
                  <AdjustPointsForm businessId={businessId} membershipId={m.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
