import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // No-op when running in a render phase that does not allow cookie writes.
        }
      },
    },
  });
}
