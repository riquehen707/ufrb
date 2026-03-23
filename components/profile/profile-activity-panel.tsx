"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Coins,
  MessageSquareText,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";

import styles from "@/components/profile/profile-activity-panel.module.scss";
import type {
  ProfileActivitySnapshot,
  ReviewTask,
} from "@/lib/profile-activity";

type Props = {
  activity: ProfileActivitySnapshot;
};

type MessageState =
  | {
      tone: "success" | "error";
      text: string;
    }
  | null;

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(value: string | null) {
  if (!value) {
    return "Agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  if (status === "completed") {
    return "Concluido";
  }

  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "cancelled") {
    return "Cancelado";
  }

  return "Pendente";
}

function ReviewComposer({
  task,
  onClose,
}: {
  task: ReviewTask;
  onClose: () => void;
}) {
  const router = useRouter();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [isPending, startTransition] = useTransition();

  function submitReview() {
    setMessage(null);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/profile/reviews", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            orderId: task.orderId,
            rating: Number(rating),
            comment: comment.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setMessage({
            tone: "error",
            text: payload?.error ?? "Nao foi possivel salvar a avaliacao.",
          });
          return;
        }

        setMessage({
          tone: "success",
          text: "Avaliacao enviada.",
        });
        router.refresh();
        onClose();
      })();
    });
  }

  return (
    <div className={styles.reviewForm}>
      <div className={styles.field}>
        <label htmlFor={`review-rating-${task.orderId}`}>Nota</label>
        <select
          id={`review-rating-${task.orderId}`}
          className="select-field"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
        >
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={`review-comment-${task.orderId}`}>Comentario</label>
        <textarea
          id={`review-comment-${task.orderId}`}
          className={styles.textarea}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Como foi essa compra, venda ou atendimento?"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="primary-button"
          onClick={submitReview}
          disabled={isPending}
        >
          {isPending ? "Enviando..." : "Enviar avaliacao"}
        </button>
        <button type="button" className="ghost-button" onClick={onClose}>
          Fechar
        </button>
      </div>

      {message ? (
        <div className="status-banner" data-tone={message.tone}>
          {message.text}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileActivityPanel({ activity }: Props) {
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const purchasesTotal = activity.recentPurchases.reduce(
    (total, order) => total + order.amount,
    0,
  );
  const salesTotal = activity.recentSales.reduce(
    (total, order) => total + order.amount,
    0,
  );

  return (
    <section className={styles.shell}>
      <div className={styles.sectionTitle}>
        <strong>Movimentacao</strong>
        <span>Compras recentes, vendas e avaliacoes para resolver.</span>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>Compras</span>
          <strong>{activity.recentPurchases.length}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span>Vendas</span>
          <strong>{activity.recentSales.length}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span>Pendentes</span>
          <strong>{activity.pendingReviews.length}</strong>
        </article>
      </div>

      <div className={styles.boardGrid}>
        <article className={styles.boardCard}>
          <div className={styles.sectionTitle}>
            <strong>Ultimas compras</strong>
            <span>{moneyFormatter.format(purchasesTotal)} movimentados.</span>
          </div>

          {activity.recentPurchases.length ? (
            <div className={styles.list}>
              {activity.recentPurchases.map((order) => (
                <article key={order.id} className={styles.listItem}>
                  <div className={styles.topline}>
                    <strong>{order.title}</strong>
                    <span className="status-pill" data-tone="info">
                      {order.orderType === "product" ? "Produto" : "Servico"}
                    </span>
                  </div>
                  <p className={styles.subtitle}>{order.counterpartName}</p>
                  <div className={styles.meta}>
                    <span>
                      <ShoppingBag size={14} />
                      {moneyFormatter.format(order.amount)}
                    </span>
                    <span>{getStatusLabel(order.status)}</span>
                    <span>{formatDate(order.completedAt ?? order.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <strong>Ainda sem compras.</strong>
              <p className={styles.emptyText}>Quando um pedido teu fechar, ele aparece aqui.</p>
            </div>
          )}
        </article>

        <article className={styles.boardCard}>
          <div className={styles.sectionTitle}>
            <strong>Ultimas vendas</strong>
            <span>{moneyFormatter.format(salesTotal)} nas ultimas movimentacoes.</span>
          </div>

          {activity.recentSales.length ? (
            <div className={styles.list}>
              {activity.recentSales.map((order) => (
                <article key={order.id} className={styles.listItem}>
                  <div className={styles.topline}>
                    <strong>{order.title}</strong>
                    <span className="status-pill" data-tone="success">
                      {order.orderType === "product" ? "Produto" : "Servico"}
                    </span>
                  </div>
                  <p className={styles.subtitle}>{order.counterpartName}</p>
                  <div className={styles.meta}>
                    <span>
                      <Store size={14} />
                      {moneyFormatter.format(order.amount)}
                    </span>
                    <span>{getStatusLabel(order.status)}</span>
                    <span>{formatDate(order.completedAt ?? order.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <strong>Ainda sem vendas.</strong>
              <p className={styles.emptyText}>Os fechamentos do teu lado entram aqui.</p>
            </div>
          )}
        </article>

        <article className={styles.boardCard}>
          <div className={styles.sectionTitle}>
            <strong>Avaliacoes pendentes</strong>
            <span>Resolve isso rapido para manter o perfil redondo.</span>
          </div>

          {activity.pendingReviews.length ? (
            <div className={styles.list}>
              {activity.pendingReviews.map((task) => (
                <article key={task.orderId} className={styles.listItem}>
                  <div className={styles.topline}>
                    <strong>{task.title}</strong>
                    <span className="status-pill" data-tone="warning">
                      Avaliar
                    </span>
                  </div>
                  <p className={styles.subtitle}>{task.counterpartName}</p>
                  <div className={styles.meta}>
                    <span>
                      <Coins size={14} />
                      {moneyFormatter.format(task.amount)}
                    </span>
                    <span>{formatDate(task.completedAt)}</span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setExpandedReviewId((current) =>
                          current === task.orderId ? null : task.orderId,
                        )
                      }
                    >
                      {expandedReviewId === task.orderId ? "Fechar" : "Avaliar agora"}
                    </button>
                  </div>

                  {expandedReviewId === task.orderId ? (
                    <ReviewComposer
                      task={task}
                      onClose={() => setExpandedReviewId(null)}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <strong>Nada pendente.</strong>
              <p className={styles.emptyText}>As proximas avaliacoes entram aqui.</p>
            </div>
          )}
        </article>
      </div>

      <article className={styles.boardCard}>
        <div className={styles.sectionTitle}>
          <strong>Avaliacoes recebidas</strong>
          <span>Como teu perfil esta sendo percebido no app.</span>
        </div>

        {activity.receivedReviews.length ? (
          <div className={styles.list}>
            {activity.receivedReviews.map((review) => (
              <article key={review.id} className={styles.listItem}>
                <div className={styles.topline}>
                  <strong>{review.title}</strong>
                  <div className={styles.ratingRow}>
                    <Star size={14} />
                    {review.rating.toFixed(1)}
                  </div>
                </div>
                <div className={styles.reviewCopy}>
                  <p>
                    {review.reviewerName} ·{" "}
                    {review.reviewType === "product" ? "Produto" : "Servico"} ·{" "}
                    {formatDate(review.createdAt)}
                  </p>
                  {review.comment ? (
                    <p>
                      <MessageSquareText size={14} style={{ verticalAlign: "text-bottom" }} />{" "}
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <strong>Nenhuma avaliacao recebida ainda.</strong>
            <p className={styles.emptyText}>Quando teus fechamentos gerarem feedback, entra aqui.</p>
          </div>
        )}
      </article>
    </section>
  );
}
