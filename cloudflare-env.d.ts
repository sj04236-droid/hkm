declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GOOGLE_CLIENT_ID?: string;
    TOSS_CLIENT_KEY?: string;
    TOSS_SECRET_KEY?: string;
    SESSION_SECRET?: string;
    BILLING_ENCRYPTION_KEY?: string;
    RENEWAL_SECRET?: string;
    ADMIN_EMAILS?: string;
  }
}
