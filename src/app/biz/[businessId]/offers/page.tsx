import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OffersManager from "@/components/OffersManager";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = { title: "Offers" };

export default async function BizOffersPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) notFound();
  const offers = await prisma.offer.findMany({
    where: { businessId },
    orderBy: [{ active: "desc" }, { startsAt: "asc" }],
  });

  return (
    <ScrollReveal direction="up">
      <OffersManager
        businessId={businessId}
        offers={offers.map((o) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          kind: o.kind,
          discount: o.discount,
          startsAt: o.startsAt?.toISOString() ?? null,
          endsAt: o.endsAt?.toISOString() ?? null,
          active: o.active,
        }))}
      />
    </ScrollReveal>
  );
}
