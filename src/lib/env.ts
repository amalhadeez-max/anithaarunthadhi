/** Small helpers to read env vars with clear failures (server only for secrets). */
export function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918608612481",
  storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "Anithaarunthadhi",
};

export const isSupabaseConfigured = () =>
  Boolean(
    publicEnv.supabaseUrl && publicEnv.supabaseAnonKey && !publicEnv.supabaseUrl.includes("YOUR-PROJECT-REF"),
  );
