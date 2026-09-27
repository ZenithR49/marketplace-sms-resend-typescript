import assert from "node:assert/strict";
import { VerificationRequest } from "./marketplace_service.js";
const accepted = VerificationRequest.safeParse({ orderId: "ORDER-1042", buyerPhone: "+14155550123", sellerAssetIds: ["asset-7"] });
const rejected = VerificationRequest.safeParse({ orderId: "ORDER-1042", buyerPhone: "555", sellerAssetIds: [] });
assert.equal(accepted.success, true);
assert.equal(rejected.success, false);
console.log("request boundary: valid marketplace handoff accepted; malformed buyer input rejected");
