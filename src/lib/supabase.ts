import { createClient } from '@supabase/supabase-js';

/** Same CareVisit project as the Expo app (`mgomkwhyrcriwlysjphm`). Anon key is public. */
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://mgomkwhyrcriwlysjphm.supabase.co';

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nb21rd2h5cmNyaXdseXNqcGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTQzMDksImV4cCI6MjEwMjI3MDMwOX0.Ae-TxBgpXQgjYUZSQ1tF0WjMCJ1wmskWDX6EYpK2EP8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export async function invokeAdminAuth(body: Record<string, unknown>, withSession = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };
  if (withSession) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-auth`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; id?: string };
  if (!res.ok) {
    return { error: json.error ?? `Request failed (${res.status})` };
  }
  return json;
}
