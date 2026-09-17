import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RewardsManager from "@/components/RewardsManager";

export const metadata = { title: "Rewards" };

export default async function BizRewardsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) notFound();
  const rewards = await prisma.reward.findMany({
    where: { businessId },
    orderBy: { cost: "asc" },
  });

  return (
    <RewardsManager
      businessId={businessId}
      rewards={rewards.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        cost: r.cost,
        expiresInDays: r.expiresInDays,
        active: r.active,
      }))}
    />
  );
}