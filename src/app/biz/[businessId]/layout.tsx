import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import BizTabs from "@/components/BizTabs";

export default async function BizLayout({ children, params }: { children: React.ReactNode; params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const staff = await prisma.businessStaff.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (!staff) notFound();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) notFound();

  return (
    <div className="container">
      <div className="card">
        <h1>{business.name}</h1>
        <p>
          <code className="mono">/{business.slug}</code>{" "}
          <span className={`badge ${staff.role === "OWNER" ? "good" : "muted"}`}>{staff.role}</span>
        </p>
        <BizTabs businessId={businessId} />
      </div>
      {children}
    </div>
  );
}
