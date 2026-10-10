import { env } from "cloudflare:workers";
import { getSession } from "../../../lib/auth-session";
import { isUnlimitedAdmin } from "../../../lib/admin-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ authenticated: false });
  const account = await env.DB.prepare("SELECT trial_used, subscription_status, next_billing_at, picture FROM accounts WHERE id = ?").bind(user.id).first<{ trial_used: number; subscription_status: string; next_billing_at: string | null; picture: string | null }>();
  if (!account) return Response.json({ authenticated: false });
  const admin = isUnlimitedAdmin(user.email, env.ADMIN_EMAILS);
  return Response.json({
    authenticated: true,
    user: { email: user.email, name: user.name, picture: account.picture, role: admin ? "admin" : "member" },
    subscription: { used: account.trial_used, limit: 10, status: admin ? "admin" : account.subscription_status, nextBillingAt: account.next_billing_at },
  });
}
