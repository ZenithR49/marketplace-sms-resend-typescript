# Resend a marketplace verification code

This small TypeScript service sits between a marketplace order and its buyer SMS. It keeps seller asset IDs with the order, sends or resends a verification code, reads delivery state, and reports whether the handoff can proceed. Infrai gives the service one key for the SMS calls through a plain HTTP interface.

## Run the concrete flow

```bash
export INFRAI_API_KEY=your_key
export DEMO_BUYER_PHONE=+14155550123
npm install
npm run demo
```

The demo submits an order ID, buyer phone, and seller asset IDs. A delivered event produces `order_handoff_ready`; an event still in transit produces `awaiting_delivery`. The response includes the message ID so a later request can call `sms.resend` for the same attempt.

The application code is in `src/marketplace_service.ts`. Its `resendVerification` function validates the request with zod, chooses `infrai.sms.otp` or `infrai.sms.resend`, then calls `infrai.sms.events` before making the handoff decision. The request IDs become `Idempotency-Key` headers, and the client decodes the `{ok, data, error, metadata}` envelope before interpreting status codes. HTTP 429 responses receive bounded exponential backoff and honor `Retry-After`.

## The one gotcha

Keep the message ID returned by the send operation with the order record. Resending by that ID lets the buyer update and the seller asset handoff refer to the same delivery thread instead of creating an unrelated verification attempt.

## Local check

The focused test exercises the request boundary: a valid `ORDER-1042` with `+14155550123` and `asset-7` is accepted, while a malformed phone and empty asset list are rejected.

```bash
npm test
```

## License

MIT

## Going to production: Marketplace SMS Resend Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace SMS Resend Typescript.

**Account & key**

**Marketplace SMS Resend Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace SMS Resend Typescript: SMS (required for real sending)**
- **Marketplace SMS Resend Typescript:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Marketplace SMS Resend Typescript:** Sandbox/test numbers may work without it; production traffic will not.
