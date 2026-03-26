import { NextResponse } from "next/server";

import {
  getPicPayWebhookToken,
  resolvePicPayWebhookToken,
} from "@/lib/payments/picpay/client";
import type { PicPayWebhookEvent } from "@/lib/payments/picpay/types";
import { processPicPayWebhook } from "@/lib/services/picpay-billing-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expectedToken = getPicPayWebhookToken();

  if (!expectedToken) {
    return NextResponse.json(
      { error: "Webhook do PicPay nao configurado." },
      { status: 503 },
    );
  }

  const providedToken = resolvePicPayWebhookToken(
    request.headers.get("authorization"),
  );

  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Webhook nao autorizado." }, { status: 401 });
  }

  let event: PicPayWebhookEvent;

  try {
    event = (await request.json()) as PicPayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const eventTypeHeader = request.headers.get("event-type");

  if (eventTypeHeader && eventTypeHeader !== "TransactionUpdateMessage") {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: "unsupported_event_type",
    });
  }

  if (event.type && event.type !== "PAYMENT") {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: "unsupported_payload_type",
    });
  }

  try {
    const result = await processPicPayWebhook(event);

    console.info("picpay_webhook_processed", {
      eventId: event.id ?? null,
      ignored: result.ignored,
      paymentId: "payment" in result && result.payment ? result.payment.id : null,
    });

    return NextResponse.json({
      received: true,
      ignored: result.ignored,
      reason: "reason" in result ? result.reason : null,
    });
  } catch (error) {
    console.error("picpay_webhook_failed", {
      eventId: event.id ?? null,
      message:
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "unknown_error",
    });

    return NextResponse.json(
      { error: "Falha ao processar o webhook do PicPay." },
      { status: 500 },
    );
  }
}
