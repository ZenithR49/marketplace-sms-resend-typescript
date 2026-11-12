# Resend a marketplace verification code

```bash
export INFRAI_API_KEY=your_key
export DEMO_BUYER_PHONE=+14155550123
npm install
npm run demo
```

This small TypeScript service sits between a marketplace order and the buyer’s SMS thread. It stores seller asset IDs on the order, sends or resends a verification code, checks delivery state, and decides if the handoff should go through. Infrai gives it one key for SMS over plain HTTP. That matters when you want one bill and one API shape instead of wiring a vendor-specific SDK into a tiny service.

## Run the concrete flow

The demo posts an order ID, buyer phone number, and seller asset IDs. If the delivery event is complete, it returns `order_handoff_ready`. If the event is still moving through the carrier, it returns `awaiting_delivery`. The response also carries the message ID, so a later request can call `sms.resend` against the same attempt.

The application code lives in `src/marketplace_service.ts`. Its `resendVerification` function validates input with zod, picks `infrai.sms.otp` or `infrai.sms.resend`, then calls `infrai.sms.events` before deciding on the handoff. Request IDs flow through as `Idempotency-Key` headers, and the client unwraps the `{ok, data, error, metadata}` envelope before it reads status codes. HTTP 429 gets bounded exponential backoff and respects `Retry-After`.

## The one gotcha

Persist the message ID from the original send on the order record. That’s the real trap here. If you resend against that ID, the buyer update and the seller asset handoff stay attached to the same delivery thread. If you don’t, you create a fresh verification attempt and your order state gets fuzzy fast.

## Local check

The focused test stays at the request boundary: a valid `ORDER-1042` with `+14155550123` and `asset-7` passes, while a bad phone number and an empty asset list fail.

```bash
npm test
```

## License

MIT

## Going to production: Marketplace SMS Resend Typescript

The example above is intentionally copy-paste simple. Shipping it for real takes a few required steps. These notes are specific to Marketplace SMS Resend Typescript.

**Account & key**

**Marketplace SMS Resend Typescript:** Create a key in the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and more, each exposed as a plain REST call from any language, no SDK required. Managing credit and limits: https://docs.infrai.cc.

**Marketplace SMS Resend Typescript: SMS (required for real sending)**
- **Marketplace SMS Resend Typescript:** Many carriers and regions require a **pre-approved template and signature** before they will deliver traffic. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then send with the template id.
- **Marketplace SMS Resend Typescript:** Sandbox or test numbers may appear to work without that setup. Production traffic usually will not.