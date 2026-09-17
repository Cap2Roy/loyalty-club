import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AcceptInviteButton from "@/components/AcceptInviteButton";

export const metadata = { title: "My invites" };

export default async function InvitesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const invites = await prisma.staffInvite.findMany({
    where: { email: user.email, acceptedAt: null },
    orderBy: { createdAt: "desc" },
    include: { business: { select: { name: true, slug: true } } },
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>My invites</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
          Staff invitations waiting for you to accept.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href="/app" className="badge muted">My clubs</a>
        <a href="/app/explore" className="badge muted">Explore clubs</a>
        <a href="/app/offers" className="badge muted">Offers feed</a>
        <span className="badge">My invites</span>
        <a href="/app/map" className="badge muted">Map</a>
        <a href="/app/account" className="badge muted">Account</a>
      </div>

      {invites.length === 0 ? (
        <div className="card">
          <p className="empty" style={{ margin: 0 }}>No pending invites. Ask a business owner to invite you by your email.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {invites.map((invite) => (
            <div key={invite.id} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{invite.business.name}</div>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
                    Invited to join as staff
                  </p>
                </div>
                <AcceptInviteButton inviteId={invite.id} businessSlug={invite.business.slug} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
