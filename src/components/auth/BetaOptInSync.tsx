"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const BETA_OPT_IN_KEY = "juscad-beta-opt-in";

/** Saves a beta opt-in made just before Google sign-in, once the session exists. */
export function BetaOptInSync() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (sessionStorage.getItem(BETA_OPT_IN_KEY) !== "1") return;
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      if (data.user.user_metadata?.beta_opt_in === true) {
        sessionStorage.removeItem(BETA_OPT_IN_KEY);
        return;
      }
      const { error } = await supabase.auth.updateUser({ data: { beta_opt_in: true } });
      if (!error) sessionStorage.removeItem(BETA_OPT_IN_KEY);
    });
  }, []);
  return null;
}
