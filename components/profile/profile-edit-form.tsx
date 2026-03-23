"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import styles from "@/components/profile/profile-shell.module.scss";
import { campusOptions } from "@/lib/campuses";
import type { PublicProfile } from "@/lib/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  userId: string | null;
  profile: PublicProfile | null;
};

type FormState = {
  fullName: string;
  university: string;
  campus: string;
  accountType: string;
  course: string;
  headline: string;
  bio: string;
  specialties: string;
  contactEmail: string;
  contactPhone: string;
  instagramHandle: string;
};

type MessageState =
  | {
      tone: "info" | "success" | "error";
      text: string;
    }
  | null;

function createInitialState(profile: PublicProfile | null): FormState {
  return {
    fullName: profile?.fullName ?? "",
    university: profile?.university ?? "UFRB",
    campus: profile?.campus ?? campusOptions[0] ?? "Cruz das Almas",
    accountType: profile?.accountType ?? "buyer",
    course: profile?.course ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    specialties: profile?.specialties.join(", ") ?? "",
    contactEmail: profile?.contactEmail ?? "",
    contactPhone: profile?.contactPhone ?? "",
    instagramHandle: profile?.instagramHandle ?? "",
  };
}

export function ProfileEditForm({ userId, profile }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialState(profile));
  const [message, setMessage] = useState<MessageState>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!userId) {
      setMessage({
        tone: "info",
        text: "Entra na tua conta para editar teu perfil.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage({
        tone: "error",
        text: "Nao rolou abrir o perfil agora.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        const specialties = form.specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const { error } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: form.fullName,
          university: form.university,
          campus: form.campus,
          account_type: form.accountType,
          course: form.course || null,
          headline: form.headline || null,
          bio: form.bio || null,
          contact_email: form.contactEmail || null,
          contact_phone: form.contactPhone || null,
          instagram_handle: form.instagramHandle || null,
          specialties,
        });

        if (error) {
          setMessage({
            tone: "error",
            text: "Nao foi possivel salvar teu perfil agora.",
          });
          return;
        }

        await supabase.auth.updateUser({
          data: {
            full_name: form.fullName,
            university: form.university,
            campus: form.campus,
            account_type: form.accountType,
          },
        });

        router.push("/perfil?salvo=1");
      })();
    });
  }

  return (
    <section className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Editar perfil</span>
          <h1>{profile?.fullName ?? "Meu perfil"}</h1>
          <p>Teu nome, tua area e tua bio.</p>
        </div>

        <div className={styles.actionRow}>
          {profile ? (
            <Link className={styles.secondaryLink} href={`/perfil/${profile.id}`}>
              Ver perfil publico
            </Link>
          ) : null}
          <Link className={styles.secondaryLink} href="/perfil">
            Voltar ao perfil
          </Link>
        </div>
      </section>

      <section className={styles.card}>
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="profile-full-name">Nome</label>
              <input
                id="profile-full-name"
                className="input-field"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="profile-course">Curso ou area</label>
              <input
                id="profile-course"
                className="input-field"
                value={form.course}
                onChange={(event) => updateField("course", event.target.value)}
                placeholder="Ex.: Ciencia da Computacao"
              />
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="profile-university">Universidade</label>
              <input
                id="profile-university"
                className="input-field"
                value={form.university}
                onChange={(event) => updateField("university", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="profile-campus">Campus</label>
              <select
                id="profile-campus"
                className="select-field"
                value={form.campus}
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

          <div className="field">
            <label htmlFor="profile-account-type">Como tu usa a conta</label>
            <select
              id="profile-account-type"
              className="select-field"
              value={form.accountType}
              onChange={(event) => updateField("accountType", event.target.value)}
            >
              <option value="buyer">Comprar</option>
              <option value="seller">Produtos e moradia</option>
              <option value="service-provider">Servicos e aulas</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="profile-headline">Headline</label>
            <input
              id="profile-headline"
              className="input-field"
              value={form.headline}
              onChange={(event) => updateField("headline", event.target.value)}
              placeholder="Ex.: Aulas de exatas e grupos pequenos"
            />
          </div>

          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="profile-contact-email">E-mail publico</label>
              <input
                id="profile-contact-email"
                className="input-field"
                type="email"
                value={form.contactEmail}
                onChange={(event) => updateField("contactEmail", event.target.value)}
                placeholder="voce@ufrb.edu.br"
              />
            </div>

            <div className="field">
              <label htmlFor="profile-contact-phone">WhatsApp</label>
              <input
                id="profile-contact-phone"
                className="input-field"
                value={form.contactPhone}
                onChange={(event) => updateField("contactPhone", event.target.value)}
                placeholder="Ex.: (75) 99999-9999"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="profile-instagram">Instagram</label>
            <input
              id="profile-instagram"
              className="input-field"
              value={form.instagramHandle}
              onChange={(event) => updateField("instagramHandle", event.target.value)}
              placeholder="Ex.: @teuinsta"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className="textarea-field"
              rows={6}
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Conta o que tu faz e onde costuma atuar."
            />
          </div>

          <div className="field">
            <label htmlFor="profile-specialties">Especialidades</label>
            <input
              id="profile-specialties"
              className="input-field"
              value={form.specialties}
              onChange={(event) => updateField("specialties", event.target.value)}
              placeholder="Ex.: Calculo, Montagem, Transporte comunitario"
            />
            <p className={styles.helperText}>Separadas por virgula.</p>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.actionLink} type="submit" disabled={isPending}>
              <Save size={16} />
              {isPending ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>

        {message ? (
          <div className="status-banner" data-tone={message.tone}>
            {message.text}
          </div>
        ) : null}
      </section>
    </section>
  );
}
