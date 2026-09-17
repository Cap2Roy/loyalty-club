import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CounterPanel from "@/components/CounterPanel";

export default async function CounterPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  const user = await currentUser();
  if (!user) notFound();

  const staff = await prisma.businessStaff.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (!staff) notFound();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { program: true },
  });
  if (!business) notFound();

  return (
    <CounterPanel
      businessId={business.id}
      businessName={business.name}
      program={{
        pointsName: business.program?.pointsName ?? "points",
        earnRate: business.program?.earnRate ?? 10,
        currency: business.program?.currency ?? "USD",
      }}
    />
  );
}
