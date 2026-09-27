import { z } from "zod";
import { infrai } from "./infrai.js";

export const VerificationRequest = z.object({ orderId: z.string().min(1), buyerPhone: z.string().regex(/^\+[1-9]\d{7,14}$/), sellerAssetIds: z.array(z.string()).min(1), messageId: z.string().optional() });
export type VerificationRequest = z.infer<typeof VerificationRequest>;
export type MarketplaceResult = { state: "code_sent" | "awaiting_delivery" | "order_handoff_ready"; orderId: string; sellerAssetIds: string[]; buyerUpdate: string; messageId: string };

export async function resendVerification(input: unknown): Promise<MarketplaceResult> {
  const request = VerificationRequest.parse(input);
  const message = request.messageId
    ? await infrai.sms.resend(request.messageId, `resend-${request.orderId}`)
    : await infrai.sms.otp(request.buyerPhone, `otp-${request.orderId}`);
  const delivery = await infrai.sms.events(message.message_id);
  const delivered = ["delivered", "sent"].includes(delivery.status.toLowerCase());
  return { state: delivered ? "order_handoff_ready" : "awaiting_delivery", orderId: request.orderId, sellerAssetIds: request.sellerAssetIds, buyerUpdate: delivered ? "Buyer can receive the handoff update." : "Buyer is waiting for the verification message.", messageId: message.message_id };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await resendVerification({ orderId: "ORDER-1042", buyerPhone: process.env.DEMO_BUYER_PHONE ?? "+14155550123", sellerAssetIds: ["asset-7"] });
  console.log(JSON.stringify(result, null, 2));
}
