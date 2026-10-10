import { env } from "cloudflare:workers";
import { getSession } from "../../../../lib/auth-session";
import { encryptBillingKey } from "../../../../lib/billing-crypto";

const MONTHLY_PRICE = 9900;

function redirectTo(request: Request, result: string, message?: string) {
  const url = new URL("/app.html", request.url);
  url.searchParams.set("billing", result);
  if (message) url.searchParams.set("message", message.slice(0, 120));
  return Response.redirect(url, 303);
}

export async function GET(request: Request) {
  try {
    const user = await getSession();
    if (!user) return redirectTo(request, "login-required");
    const url = new URL(request.url);
    const authKey = url.searchParams.get("authKey");
    const customerKey = url.searchParams.get("customerKey");
    if (!authKey || !customerKey || !env.TOSS_SECRET_KEY) return redirectTo(request, "failed", "결제 인증 정보가 없습니다.");
    const account = await env.DB.prepare("SELECT customer_key FROM accounts WHERE id = ?").bind(user.id).first<{ customer_key: string }>();
    if (!account || account.customer_key !== customerKey) return redirectTo(request, "failed", "고객 정보가 일치하지 않습니다.");
    const authorization = `Basic ${btoa(`${env.TOSS_SECRET_KEY}:`)}`;
    const issueResponse = await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue", {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ authKey, customerKey }),
    });
    const issue = (await issueResponse.json()) as { billingKey?: string; message?: string };
    if (!issueResponse.ok || !issue.billingKey) return redirectTo(request, "failed", issue.message ?? "빌링키 발급에 실패했습니다.");
    const orderId = `ATR-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const paymentResponse = await fetch(`https://api.tosspayments.com/v1/billing/${encodeURIComponent(issue.billingKey)}`, {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ customerKey, amount: MONTHLY_PRICE, orderId, orderName: "ATR Travel Ops Pro 월간 구독", customerEmail: user.email, customerName: user.name, taxFreeAmount: 0 }),
    });
    const payment = (await paymentResponse.json()) as { paymentKey?: string; status?: string; approvedAt?: string; message?: string };
    if (!paymentResponse.ok || payment.status !== "DONE") return redirectTo(request, "failed", payment.message ?? "첫 결제 승인에 실패했습니다.");
    const nextBillingAt = new Date();
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);
    await env.DB.batch([
      env.DB.prepare("UPDATE accounts SET billing_key_cipher = ?, subscription_status = 'active', next_billing_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(await encryptBillingKey(issue.billingKey), nextBillingAt.toISOString(), user.id),
      env.DB.prepare("INSERT INTO payments (order_id, user_id, payment_key, amount, status, approved_at) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, user.id, payment.paymentKey ?? null, MONTHLY_PRICE, payment.status, payment.approvedAt ?? new Date().toISOString()),
    ]);
    return redirectTo(request, "success");
  } catch (error) {
    return redirectTo(request, "failed", error instanceof Error ? error.message : "결제 처리에 실패했습니다.");
  }
}
