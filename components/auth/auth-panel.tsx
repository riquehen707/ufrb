"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ShieldCheck, UserRoundPlus } from "lucide-react";

import styles from "@/components/auth/auth-panel.module.scss";
import { campusOptions, defaultCampus } from "@/lib/campuses";
import { getAuthCallbackUrl } from "@/lib/site-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthMode = "sign-in" | "sign-up";

type MessageState =
  | {
      tone: "info" | "success" | "error";
      text: string;
    }
  | null;

type FormState = {
  fullName: string;
  email: string;
  campus: string;
  accountType: string;
  password: string;
  confirmPassword: string;
};

type Props = {
  title?: string;
  description?: string;
  initialMode?: AuthMode;
  redirectTo?: string;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  campus: defaultCampus,
  accountType: "buyer",
  password: "",
  confirmPassword: "",
};

export function AuthPanel({
  title = "Entrar no CAMPUS",
  description = "Entrar para publicar e acompanhar teu perfil.",
  initialMode = "sign-in",
  redirectTo = "/perfil",
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [message, setMessage] = useState<MessageState>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSessionEmail(data.user?.email ?? null);
      setSessionName((data.user?.user_metadata?.full_name as string | undefined) ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
      setSessionName((session?.user?.user_metadata?.full_name as string | undefined) ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "error",
        text: "Auth indisponivel nesta previa.",
      });
      return;
    }

    if (mode === "sign-up") {
      if (formState.password.length < 8) {
        setMessage({
          tone: "error",
          text: "Usa pelo menos 8 caracteres.",
        });
        return;
      }

      if (formState.password !== formState.confirmPassword) {
        setMessage({
          tone: "error",
          text: "As senhas nao batem.",
        });
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage({
        tone: "error",
        text: "Nao deu para abrir o auth agora.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        if (mode === "sign-in") {
          const { error } = await supabase.auth.signInWithPassword({
            email: formState.email,
            password: formState.password,
          });

          if (error) {
            setMessage({
              tone: "error",
              text: error.message,
            });
            return;
          }

          router.push(redirectTo);
          router.refresh();
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
          options: {
            emailRedirectTo: getAuthCallbackUrl(redirectTo),
            data: {
              full_name: formState.fullName,
              university: "UFRB",
              campus: formState.campus,
              account_type: formState.accountType,
            },
          },
        });

        if (error) {
          setMessage({
            tone: "error",
            text: error.message,
          });
          return;
        }

        if (data.session) {
          router.push("/perfil/editar");
          router.refresh();
          return;
        }

        setMessage({
          tone: "info",
          text: "Confirma teu e-mail para entrar.",
        });
      })();
    });
  }

  function handleSignOut() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    startTransition(() => {
      void (async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      })();
    });
  }

  if (sessionEmail) {
    return (
      <section className={styles.panel}>
        <div className={styles.header}>
          <span className="eyebrow">Conta</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{description}</p>
        </div>

        <div className={styles.sessionCard}>
          <div className={styles.sessionMeta}>
            <strong>{sessionName ?? "Conta ativa"}</strong>
            <span>{sessionEmail}</span>
            <p>Pronto para publicar e conversar.</p>
          </div>

          <div className={styles.sessionPills}>
            <span className={styles.sessionPill}>
              <ShieldCheck size={14} />
              Sessao ativa
            </span>
          </div>

          <div className={styles.actionRow}>
            <Link href="/perfil" className={styles.primaryAction}>
              Ver perfil
            </Link>
            <Link href="/perfil/editar" className={styles.secondaryAction}>
              Editar perfil
            </Link>
            <button
              type="button"
              className={styles.signOutButton}
              onClick={handleSignOut}
              disabled={isPending}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className="eyebrow">Auth</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{description}</p>
      </div>

      <div className={styles.modeSwitch} role="tablist" aria-label="Modo de acesso">
        <button
          type="button"
          className={`${styles.modeButton} ${mode === "sign-in" ? styles.modeButtonActive : ""}`}
          onClick={() => setMode("sign-in")}
        >
          <LogIn size={16} />
          Entrar
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${mode === "sign-up" ? styles.modeButtonActive : ""}`}
          onClick={() => setMode("sign-up")}
        >
          <UserRoundPlus size={16} />
          Criar conta
        </button>
      </div>

      <form className={styles.formGrid} onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <div className="field">
            <label htmlFor="auth-full-name">Nome completo</label>
            <input
              id="auth-full-name"
              className="input-field"
              autoComplete="name"
              placeholder="Ex.: Ana Beatriz Santos"
              value={formState.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              required
            />
          </div>
        ) : null}

        {mode === "sign-up" ? (
          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="auth-email">E-mail</label>
              <input
                id="auth-email"
                className="input-field"
                type="email"
                autoComplete="email"
                placeholder="voce@ufrb.edu.br"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="auth-campus">Campus</label>
              <select
                id="auth-campus"
                className="select-field"
                value={formState.campus}
                onChange={(event) => updateField("campus", event.target.value)}
              >
                {campusOptions.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              className="input-field"
              type="email"
              autoComplete="email"
              placeholder="voce@ufrb.edu.br"
              value={formState.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </div>
        )}

        {mode === "sign-up" ? (
          <div className="field">
            <label htmlFor="auth-account-type">Modo inicial</label>
            <select
              id="auth-account-type"
              className="select-field"
              value={formState.accountType}
              onChange={(event) => updateField("accountType", event.target.value)}
            >
              <option value="buyer">Comprar</option>
              <option value="seller">Produtos e moradia</option>
              <option value="service-provider">Servicos e aulas</option>
            </select>
          </div>
        ) : null}

        {mode === "sign-up" ? (
          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="auth-password">Senha</label>
              <input
                id="auth-password"
                className="input-field"
                type="password"
                autoComplete="new-password"
                placeholder="Minimo de 8 caracteres"
                value={formState.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="auth-confirm-password">Confirmar senha</label>
              <input
                id="auth-confirm-password"
                className="input-field"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={formState.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                required
              />
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              className="input-field"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={formState.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </div>
        )}

        <div className={styles.actionRow}>
          <button className={styles.primaryAction} type="submit" disabled={isPending}>
            {isPending
              ? "Carregando..."
              : mode === "sign-in"
                ? "Entrar"
                : "Criar conta"}
          </button>
          <Link href="/" className={styles.secondaryAction}>
            Voltar
          </Link>
        </div>
      </form>

      <p className={styles.note}>
        {mode === "sign-in"
          ? "Entra para publicar e responder."
          : "Cria tua conta e ajusta o perfil depois."}
      </p>

      {message ? (
        <div className="status-banner" data-tone={message.tone}>
          {message.text}
        </div>
      ) : null}
    </section>
  );
}
