import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JoinForm from "@/components/JoinForm";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { ref } = await searchParams;
  let initialSlug = "";
  if (ref) {
    const membership = await prisma.membership.findUnique({
      where: { referralCode: ref },
      include: { business: { select: { slug: true } } },
    });
    if (membership) initialSlug = membership.business.slug;
  }

  return (
    <div style={{ maxWidth: 480, margin: "48px auto 0" }}>
      <div className="card">
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Join a club</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Enter the club name you received from the business or a friend&apos;s invite.
        </p>
        <JoinForm initialSlug={initialSlug} />
      </div>
    </div>
  );
}
