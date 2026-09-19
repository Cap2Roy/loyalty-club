import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";

export default async function CounterHome() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/counter");

  const businesses = await prisma.business.findMany({
    where: { staff: { some: { userId: user.id } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <ScrollReveal direction="up">
        <h1 style={{ marginTop: 0 }}>Staff counter</h1>
      </ScrollReveal>
      <ScrollReveal direction="up" delay={1}>
        {businesses.length === 0 ? (
          <div className="empty">
            <p>You are not staff of any business. Ask the business owner to create a staff account for you by sharing their business slug.</p>
            <Link href="/biz" className="btn secondary small">Go to business area</Link>
          </div>
        ) : (
          <div className="grid cols-2">
            {businesses.map((b) => (
              <Link key={b.id} href={`/counter/${b.id}`} className="card stagger-item" style={{ color: "inherit", textDecoration: "none" }}>
                <h2>{b.name}</h2>
                <span className="badge muted">{b.slug}</span>
              </Link>
            ))}
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}
