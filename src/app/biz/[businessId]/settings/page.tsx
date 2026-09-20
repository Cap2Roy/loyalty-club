import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import ProgramSettingsForm from "@/components/ProgramSettingsForm";
import BusinessSettingsForm from "@/components/BusinessSettingsForm";
import StaffInviteManager from "@/components/StaffInviteManager";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = { title: "Program settings" };

export default async function BizSettingsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const staff = await prisma.businessStaff.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (!staff || staff.role !== "OWNER") notFound();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) notFound();
  const program = await prisma.program.findUnique({ where: { businessId } });
  const invites = await prisma.staffInvite.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { invitee: { select: { email: true } } },
  });
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <ScrollReveal direction="up">
        <div className="card">
          <h2>Business info</h2>
          <p>Edit your business name, address, and map location.</p>
          <BusinessSettingsForm
            businessId={businessId}
            business={{
              name: business.name,
              address: business.address,
              latitude: business.latitude,
              longitude: business.longitude,
            }}
          />
        </div>
      </ScrollReveal>
      <ScrollReveal direction="up" delay={1}>
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
      </ScrollReveal>
      <ScrollReveal direction="up" delay={2}>
        <StaffInviteManager businessId={businessId} invites={invites} />
      </ScrollReveal>
    </div>
  );
}
