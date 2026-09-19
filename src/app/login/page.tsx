import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import ScrollReveal from "@/components/ScrollReveal";

export default async function LoginPage() {
  if (await currentUser()) redirect("/app");

  return (
    <div className="auth-wrap fade-in">
      <ScrollReveal direction="scale">
        <div className="auth-card">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--gradient-brand)",
              boxShadow: "var(--shadow-brand)",
              marginBottom: 16,
            }}>
              <span style={{ color: "#fff", fontSize: 26, fontWeight: 800 }}>◆</span>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Welcome back</h2>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>
              Access your loyalty points across all your favorite clubs.
            </p>
          </div>
          <LoginForm />
        </div>
      </ScrollReveal>
    </div>
  );
}
