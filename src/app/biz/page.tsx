import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "My businesses" };

export default async function BizListPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const rows = await prisma.businessStaff.findMany({
    where: { userId: user.id },
    include: { business: true },
    orderBy: { business: { createdAt: "asc" } },
  });

  return (
    <div className="container">
      <div className="card">
        <h1>My businesses</h1>
        <p>
          <Link href="/biz/new" className="btn">New business</Link>
        </p>
        {rows.length === 0 ? (
          <p className="empty">You have no businesses yet. Create one to start a loyalty club.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.business.name}</td>
                  <td><code className="mono">{row.business.slug}</code></td>
                  <td>
                    <span className={`badge ${row.role === "OWNER" ? "good" : "muted"}`}>{row.role}</span>
                  </td>
                  <td>
                    <Link href={`/biz/${row.business.id}`}>Open console</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
