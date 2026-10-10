import { env } from "cloudflare:workers";
import { getSession } from "../../../../lib/auth-session";

const FEATURES = new Set(["entry", "pnr", "passport", "quote"]);

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  const { feature } = (await request.json()) as { feature?: string };
  if (!feature || !FEATURES.has(feature)) return Response.json({ error: "invalid_feature" }, { status: 400 });
  const result = await env.DB.prepare(`
    UPDATE accounts
    SET trial_used = CASE WHEN subscription_status = 'active' THEN trial_used ELSE trial_used + 1 END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND (subscription_status = 'active' OR trial_used < 10)
    RETURNING trial_used, subscription_status
  `).bind(user.id).first<{ trial_used: number; subscription_status: string }>();
  if (!result) return Response.json({ allowed: false, used: 10, remaining: 0, status: "trial" }, { status: 402 });
  await env.DB.prepare("INSERT INTO usage_events (id, user_id, feature) VALUES (?, ?, ?)").bind(crypto.randomUUID(), user.id, feature).run();
  return Response.json({ allowed: true, used: result.trial_used, remaining: result.subscription_status === "active" ? null : Math.max(0, 10 - result.trial_used), status: result.subscription_status });
}
