"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignupCard() {
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setActiveAccount(data.user?.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setActiveAccount(session?.user?.email ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <section className="signup-card" id="conta">
      <span className="account-chip">
        <ShieldCheck size={16} />
        Conta
      </span>

      <h2>{activeAccount ? "Conta pronta" : "Entrar quando fizer sentido"}</h2>
      <p>
        {activeAccount
          ? "Teu perfil ja esta pronto para publicar, responder e acompanhar conversas."
          : "Cria tua conta para publicar, conversar e acompanhar pedidos sem perder o que aparecer."}
      </p>

      {activeAccount ? (
        <div className="status-banner" data-tone="success">
          <strong>Conta ativa:</strong> {activeAccount}
        </div>
      ) : null}

      <div className="form-grid">
        <Link className="action-button" href={activeAccount ? "/perfil" : "/entrar"}>
          <UserRound size={18} />
          {activeAccount ? "Minha conta" : "Entrar ou criar conta"}
        </Link>

        <Link className="secondary-button" href={activeAccount ? "/perfil/editar" : "/feed"}>
          {activeAccount ? "Editar perfil" : "Explorar primeiro"}
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
