import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLead, normalizePhone } from "../lib/lead-validation.ts";
const now = Date.now();
const sample = () => ({
  fullName: "Khách thử nghiệm",
  phone: "0900000000",
  ward: "Bình Thủy",
  demand: "Internet gia đình",
  address: "Địa chỉ thử",
  consent: true,
  requestId: "3ec5efa9-cf7a-49d5-92d0-5e92501f7f56",
  startedAt: now - 3000,
  website: "",
  utm: { utm_source: "test" },
});
test("normalizes Vietnamese mobile numbers", () =>
  assert.equal(normalizePhone("+84 900 000 000"), "0900000000"));
test("valid lead accepted and attribution retained", () => {
  const result = validateLead(sample(), now);
  assert.equal(result.lead.utm.utm_source, "test");
  assert.equal(result.lead.phone, "0900000000");
});
test("requires explicit consent", () =>
  assert.ok(
    validateLead({ ...sample(), consent: "true" }, now).errors.consent,
  ));
test("rejects invalid phone and unknown ward", () => {
  const r = validateLead({ ...sample(), phone: "123", ward: "invalid" }, now);
  assert.ok(r.errors.phone);
  assert.ok(r.errors.ward);
});
test("rejects missing and invalid session identifiers", () =>
  assert.ok(validateLead({ ...sample(), requestId: "abc" }, now).errors.form));
test("rejects instant and stale submissions", () => {
  assert.ok(validateLead({ ...sample(), startedAt: now }, now).errors.form);
  assert.ok(
    validateLead({ ...sample(), startedAt: now - 8_000_000 }, now).errors.form,
  );
});
test("caps attribution and strips unknown keys", () => {
  const r = validateLead(
    { ...sample(), utm: { utm_source: "a".repeat(500), secret: "no" } },
    now,
  );
  assert.equal(r.lead.utm.utm_source.length, 200);
  assert.equal(r.lead.utm.secret, undefined);
});
test("rejects malformed or overlong names and addresses", () => {
  assert.ok(
    validateLead({ ...sample(), fullName: "<script>" }, now).errors.fullName,
  );
  assert.ok(
    validateLead({ ...sample(), address: "x".repeat(201) }, now).errors.address,
  );
});

test("accepts each advertised package and retains choice for database persistence", () => {
  for (const demand of ["HOME1 Mesh", "CAM CANH", "CAM MẬT", "CAM SÀNH"]) {
    const result = validateLead({ ...sample(), demand }, now);
    assert.equal(result.lead?.demand, demand);
  }
  assert.ok(validateLead({ ...sample(), demand: "Gói không tồn tại" }, now).errors.demand);
});
