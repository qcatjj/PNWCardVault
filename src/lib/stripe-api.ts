import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PaymentMode = "preview-test" | "live" | "test" | "pending";

export const getPaymentMode = createServerFn({ method: "GET" }).handler(async (): Promise<PaymentMode> => {
  const { paymentMode } = await import("./stripe-checkout.server");
  return paymentMode();
});

export const startStripeCheckout = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      cancelPath: z.string().max(200).optional(),
      items: z
        .array(
          z.object({
            productId: z.number().int(),
            title: z.string().min(1).max(160),
            qty: z.number().int().min(1).max(99),
            priceCents: z.number().int().min(100),
          }),
        )
        .min(1)
        .max(40),
    }),
  )
  .handler(async ({ data }) => {
    const { createStripeCheckoutSession } = await import("./stripe-checkout.server");
    return createStripeCheckoutSession(data.items, data.email, data.cancelPath);
  });

export const fulfillStripeCheckout = createServerFn({ method: "GET" })
  .validator(z.object({ sessionId: z.string().min(3).max(200) }))
  .handler(async ({ data }) => {
    const { paidStripeItems } = await import("./stripe-checkout.server");
    const paid = await paidStripeItems(data.sessionId);
    if (!paid) throw new Error("Stripe has not marked this payment paid yet.");
    const { placeOrder } = await import("./catalog");
    return placeOrder({
      data: {
        items: paid.items,
        payment: { stripeSessionId: data.sessionId },
      },
    });
  });
