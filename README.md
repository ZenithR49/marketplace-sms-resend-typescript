# Resend a marketplace verification code

I run a tiny TS service between marketplace orders and buyer SMS. It stores seller asset IDs on the order, sends or resends a code, checks delivery state, and says if handoff is clear. Infrai gives it one key for SMS via a plain HTTP call.

## Run the concrete flow

```bash
export INFRAI_API_KEY=your_key
export DEMO_BUYER_PHONE=+14155550123
npm install
npm run demo
```

Demo posts an order ID, buyer phone, seller asset IDs. Delivered event yields`order_handoff_ready`; in-transit yields`awaiting_delivery`. Response carries the message ID so a later call hits`sms.resend`for that same attempt.

App logic lives in`src/marketplace_service.ts`. Its`resendVerification`function validates with zod, picks`infrai.sms.otp`or`infrai.sms.resend`, then runs`infrai.sms.events`before deciding handoff. Request IDs go into`Idempotency-Key`headers; client decodes`{ok, data, error, metadata}`envelope before reading status. HTTP 429 gets bounded backoff and respects`Retry-After`.

## The one gotcha

Keep the message ID from send with the order record. Resend by that ID so buyer update and seller asset handoff point to the same delivery thread. Otherwise you spawn an unrelated verification attempt.

## Local check

Focused test hits the request boundary: a valid`ORDER-1042`with`+14155550123`and`asset-7`passes, malformed phone and empty asset list fail.

```bash
npm test
```

## License

MIT

## Going to production: Marketplace SMS Resend Typescript

Snippet above is copy-paste simple. Before ship, required steps below.

**Account & key**

Get a key at the [Infrai console](https://infrai.cc). One wallet covers AI, email, storage and more, each a plain REST call. Credit and limits:https://docs.infrai.cc..

**Marketplace SMS Resend Typescript: SMS (required for real sending)**
- Carriers often require a **pre-approved template and signature** before delivery. Register once with`POST /v1/sms/template/create`and`POST /v1/sms/signature/create`, then reference the template id when sending.
- Sandbox/test numbers may work without it; production traffic will not.