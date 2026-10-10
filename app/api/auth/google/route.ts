import { env } from "cloudflare:workers";
import { createSession } from "../../../../lib/auth-session";
import { verifyGoogleIdToken } from "../../../../lib/google-id-token";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { credential?: string };
    if (!body.credential) return Response.json({ error: "구글 인증 정보가 없습니다." }, { status: 400 });
    const claims = await verifyGoogleIdToken(body.credential);
    const id = `google:${claims.sub}`;
    const existing = await env.DB.prepare("SELECT customer_key FROM accounts WHERE id = ?").bind(id).first<{ customer_key: string }>();
    const customerKey = existing?.customer_key ?? crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO accounts (id, email, name, picture, customer_key)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, updated_at = CURRENT_TIMESTAMP
    `).bind(id, claims.email, claims.name ?? claims.email, claims.picture ?? null, customerKey).run();
    await createSession({ id, email: claims.email, name: claims.name ?? claims.email });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "구글 로그인에 실패했습니다." }, { status: 401 });
  }
}
