import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import ProgramSettingsForm from "@/components/ProgramSettingsForm";
import StaffInviteManager from "@/components/StaffInviteManager";

export const metadata = { title: "Program settings" };

export default async function BizSettingsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const staff = await prisma.businessStaff.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (!staff || staff.role !== "OWNER") notFound();
  const program = await prisma.program.findUnique({ where: { businessId } });
  const invites = await prisma.staffInvite.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { invitee: { select: { email: true } } },
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="card">
        <h2>Program settings</h2>
        <p>Configure the earn rule, points name, and membership tiers. Owner only.</p>
        <ProgramSettingsForm
          businessId={businessId}
          program={{
            pointsName: program?.pointsName ?? "points",
            earnRate: program?.earnRate ?? 10,
            minRedeem: program?.minRedeem ?? 100,
            currency: program?.currency ?? "USD",
            tierNames: program?.tierNames ?? "Member",
            tierThresholds: program?.tierThresholds ?? "",
          }}
        />
      </div>
      <StaffInviteManager businessId={businessId} invites={invites} />
    </div>
  );
}
