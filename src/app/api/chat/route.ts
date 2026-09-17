import { ok, withErrors, readJson, ApiError } from "@/lib/api";
import { matchKB, bestMatch } from "@/lib/knowledge-base";

type ChatBody = { message?: string };

export async function POST(req: Request) {
  return withErrors(async () => {
    const { message } = await readJson<ChatBody>(req);
    const query = (message ?? "").trim();

    if (!query) throw new ApiError(400, "Message is required");
    if (query.length > 500) throw new ApiError(400, "Message is too long (max 500 characters)");

    const best = bestMatch(query);
    if (!best) {
      return ok({
        reply:
          "I couldn't find an answer to that. Try rephrasing your question, or visit the Help page (/help) to browse all topics.",
        matches: [],
      });
    }

    const related = matchKB(query, 4)
      .filter((m) => m.entry.id !== best.entry.id)
      .slice(0, 3)
      .map((m) => ({ id: m.entry.id, question: m.entry.question, category: m.entry.category }));

    return ok({
      reply: best.entry.answer,
      match: {
        id: best.entry.id,
        question: best.entry.question,
        category: best.entry.category,
        score: best.score,
      },
      related,
    });
  });
}
