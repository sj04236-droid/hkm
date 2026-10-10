import { env } from "cloudflare:workers";
import { getSession } from "../../../../lib/auth-session";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  if (!env.TOSS_CLIENT_KEY || !env.TOSS_SECRET_KEY) return Response.json({ error: "billing_not_configured" }, { status: 503 });
  const account = await env.DB.prepare("SELECT customer_key FROM accounts WHERE id = ?").bind(user.id).first<{ customer_key: string }>();
  if (!account) return Response.json({ error: "account_not_found" }, { status: 404 });
  return Response.json({ customerKey: account.customer_key, customerName: user.name, customerEmail: user.email });
}
