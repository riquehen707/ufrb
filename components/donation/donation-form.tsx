"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, HeartHandshake } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { donationPixKey, donationPixName } from "@/lib/supabase/env";

type SupportState = {
  donorName: string;
  donorEmail: string;
  amount: string;
  method: string;
  note: string;
  isPublic: boolean;
};

type ReceiptState = {
  paymentReference: string;
  amount: number;
} | null;

type MessageState =
  | {
      tone: "info" | "success" | "error";
      text: string;
    }
  | null;

const suggestedAmounts = ["10", "20", "35", "50"];

const initialState: SupportState = {
  donorName: "",
  donorEmail: "",
  amount: suggestedAmounts[1],
  method: "pix",
  note: "",
  isPublic: true,
};

export function DonationForm() {
  const [support, setSupport] = useState<SupportState>(initialState);
  const [message, setMessage] = useState<MessageState>(null);
  const [receipt, setReceipt] = useState<ReceiptState>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!isMounted || !data.user) {
        return;
      }

      setSupport((current) => ({
        ...current,
        donorName:
          current.donorName ||
          (data.user.user_metadata?.full_name as string | undefined) ||
          "",
        donorEmail: current.donorEmail || data.user.email || "",
      }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<K extends keyof SupportState>(
    field: K,
    value: SupportState[K],
  ) {
    setSupport((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function copyPixKey() {
    if (!donationPixKey) {
      return;
    }

    await navigator.clipboard.writeText(donationPixKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setReceipt(null);

    const amount = Number(support.amount.replace(",", "."));

    if (!support.donorName.trim() || Number.isNaN(amount) || amount <= 0) {
      setMessage({
        tone: "error",
        text: "Nome e valor valido sao obrigatorios.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/donations", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              donorName: support.donorName.trim(),
              donorEmail: support.donorEmail.trim() || null,
              amount,
              method: support.method,
              note: support.note.trim() || null,
              isPublic: support.isPublic,
            }),
          });

          const result = (await response.json().catch(() => null)) as
            | {
                error?: string;
                paymentReference?: string;
                amount?: number;
              }
            | null;

          if (!response.ok || !result?.paymentReference) {
            setMessage({
              tone: "error",
              text: result?.error ?? "Nao rolou registrar o apoio agora.",
            });
            return;
          }

          setReceipt({
            paymentReference: result.paymentReference,
            amount: result.amount ?? amount,
          });
          setMessage({
            tone: "success",
            text: "Apoio registrado. Quando o pagamento for confirmado, ele entra no teu perfil.",
          });
          setSupport((current) => ({
            ...initialState,
            donorName: current.donorName,
            donorEmail: current.donorEmail,
          }));
        } catch {
          setMessage({
            tone: "error",
            text: "Nao rolou registrar o apoio agora.",
          });
        }
      })();
    });
  }

  return (
    <div className="composer-grid">
      <section className="form-shell">
        <div className="split-header">
          <div>
            <span className="eyebrow">Apoio</span>
            <h2 className="form-title">Fortalece o CAMPUS</h2>
          </div>
        </div>

        <div className="amount-grid">
          {suggestedAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              className={`amount-pill ${support.amount === amount ? "active" : ""}`}
              onClick={() => updateField("amount", amount)}
            >
              R$ {amount}
            </button>
          ))}
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="donor-name">Nome</label>
              <input
                id="donor-name"
                className="input-field"
                placeholder="Ex.: Maria Eduarda"
                value={support.donorName}
                onChange={(event) => updateField("donorName", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="donor-email">E-mail</label>
              <input
                id="donor-email"
                className="input-field"
                type="email"
                placeholder="voce@email.com"
                value={support.donorEmail}
                onChange={(event) => updateField("donorEmail", event.target.value)}
              />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="donation-amount">Valor</label>
              <input
                id="donation-amount"
                className="input-field"
                inputMode="decimal"
                value={support.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="donation-method">Metodo</label>
              <select
                id="donation-method"
                className="select-field"
                value={support.method}
                onChange={(event) => updateField("method", event.target.value)}
              >
                <option value="pix">Pix</option>
                <option value="apoio">Apoio direto</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="donation-note">Recado</label>
            <textarea
              id="donation-note"
              className="textarea-field"
              rows={5}
              placeholder="Se quiser, deixa uma mensagem."
              value={support.note}
              onChange={(event) => updateField("note", event.target.value)}
            />
          </div>

          <label className="account-chip" htmlFor="donation-public">
            <input
              id="donation-public"
              type="checkbox"
              checked={support.isPublic}
              onChange={(event) => updateField("isPublic", event.target.checked)}
            />
            Mostrar meu nome entre apoiadores
          </label>

          <div className="form-actions">
            <button className="action-button" type="submit" disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar apoio"}
            </button>
          </div>
        </form>

        {message ? (
          <div className="status-banner" data-tone={message.tone}>
            {message.text}
          </div>
        ) : null}
      </section>

      <aside className="preview-card">
        <span className="account-chip">
          <HeartHandshake size={16} />
          Apoio confirmado entra no perfil
        </span>
        <h3>Como fica o apoio</h3>

        {receipt ? (
          <div className="pix-card">
            <strong>Referencia</strong>
            <p>{receipt.paymentReference}</p>
            <code>R$ {receipt.amount.toFixed(2).replace(".", ",")}</code>
          </div>
        ) : null}

        {donationPixKey ? (
          <div className="pix-card">
            <strong>Chave Pix</strong>
            <p>{donationPixName}</p>
            <code>{donationPixKey}</code>
            <button className="secondary-button" type="button" onClick={copyPixKey}>
              <Copy size={16} />
              {copied ? "Copiado" : "Copiar chave"}
            </button>
          </div>
        ) : (
          <div className="status-banner" data-tone="info">
            Configura a chave Pix para liberar o pagamento rapido.
          </div>
        )}
      </aside>
    </div>
  );
}
