import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    googleClientId: env.GOOGLE_CLIENT_ID ?? "",
    tossClientKey: env.TOSS_CLIENT_KEY ?? "",
    loginReady: Boolean(env.GOOGLE_CLIENT_ID && env.SESSION_SECRET),
    billingReady: Boolean(env.TOSS_CLIENT_KEY && env.TOSS_SECRET_KEY && env.BILLING_ENCRYPTION_KEY),
  });
}
