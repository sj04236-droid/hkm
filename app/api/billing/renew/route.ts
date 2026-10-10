import { env } from "cloudflare:workers";
import { decryptBillingKey } from "../../../../lib/billing-crypto";

const MONTHLY_PRICE = 9900;

export async function POST(request: Request) {
  if (!env.RENEWAL_SECRET || request.headers.get("authorization") !== `Bearer ${env.RENEWAL_SECRET}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const due = await env.DB.prepare(`SELECT id, email, name, customer_key, billing_key_cipher FROM accounts WHERE subscription_status = 'active' AND next_billing_at <= ? AND billing_key_cipher IS NOT NULL ORDER BY next_billing_at ASC LIMIT 25`).bind(new Date().toISOString()).all<{ id: string; email: string; name: string; customer_key: string; billing_key_cipher: string }>();
  const authorization = `Basic ${btoa(`${env.TOSS_SECRET_KEY}:`)}`;
  const results = [];
  for (const account of due.results) {
    const orderId = `ATR-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    try {
      const billingKey = await decryptBillingKey(account.billing_key_cipher);
      const response = await fetch(`https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`, { method: "POST", headers: { Authorization: authorization, "Content-Type": "application/json" }, body: JSON.stringify({ customerKey: account.customer_key, amount: MONTHLY_PRICE, orderId, orderName: "ATR Travel Ops Pro 월간 구독", customerEmail: account.email, customerName: account.name, taxFreeAmount: 0 }) });
      const payment = (await response.json()) as { paymentKey?: string; status?: string; approvedAt?: string; message?: string };
      if (!response.ok || payment.status !== "DONE") throw new Error(payment.message ?? "renewal_failed");
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      await env.DB.batch([
        env.DB.prepare("UPDATE accounts SET next_billing_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(next.toISOString(), account.id),
        env.DB.prepare("INSERT INTO payments (order_id, user_id, payment_key, amount, status, approved_at) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, account.id, payment.paymentKey ?? null, MONTHLY_PRICE, payment.status, payment.approvedAt ?? new Date().toISOString()),
      ]);
      results.push({ userId: account.id, ok: true });
    } catch (error) {
      await env.DB.prepare("UPDATE accounts SET subscription_status = 'past_due', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(account.id).run();
      results.push({ userId: account.id, ok: false, error: error instanceof Error ? error.message : "renewal_failed" });
    }
  }
  return Response.json({ processed: results.length, results });
}
