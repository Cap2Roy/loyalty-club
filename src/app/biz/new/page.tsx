import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import NewBusinessForm from "@/components/NewBusinessForm";

export const metadata = { title: "New business" };

export default async function NewBusinessPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="container">
      <div className="card">
        <h1>Create a business</h1>
        <p>Start a loyalty club with its own points program, rewards, and offers.</p>
        <NewBusinessForm />
      </div>
    </div>
  );
}
