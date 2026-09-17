import { ok, withErrors } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function POST() {
  return withErrors(async () => {
    await destroySession();
    return ok({});
  });
}
