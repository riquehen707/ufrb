"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  className?: string;
  redirectTo?: string;
};

export function SignOutButton({ className, redirectTo = "/" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    startTransition(() => {
      void (async () => {
        await supabase.auth.signOut();
        router.push(redirectTo);
        router.refresh();
      })();
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleSignOut}
      disabled={isPending}
    >
      <LogOut size={16} />
      {isPending ? "Saindo..." : "Sair"}
    </button>
  );
}
