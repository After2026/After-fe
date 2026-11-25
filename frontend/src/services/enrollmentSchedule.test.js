import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../lib/demo.js";
import {
  enrollmentWindowFor,
  isEnrollmentOpen,
} from "../lib/enrollmentSchedule.js";

test("a configured date opens and closes at midnight in Seoul", () => {
  const window = enrollmentWindowFor("2026-12-07");
  assert.equal(isEnrollmentOpen(window, Date.parse("2026-12-06T14:59:59.999Z")), false);
  assert.equal(isEnrollmentOpen(window, Date.parse("2026-12-06T15:00:00Z")), true);
  assert.equal(isEnrollmentOpen(window, Date.parse("2026-12-07T14:59:59.999Z")), true);
  assert.equal(isEnrollmentOpen(window, Date.parse("2026-12-07T15:00:00Z")), false);
  assert.equal(enrollmentWindowFor("2026-02-30"), null);
  assert.equal(enrollmentWindowFor(""), null);
  assert.equal(isEnrollmentOpen(null), false);
});

test("demo lists confirmed courses before opening and restricts changes to the application date", async () => {
  const window = enrollmentWindowFor("2026-12-07");
  let now = window.startsAt - 1;
  const storage = new Map();
  const api = createDemo(
    { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    undefined,
    { enrollmentWindow: window, now: () => now },
  );

  const { items } = await api.courses();
  assert.deepEqual(items.map(({ id }) => id), [4, 5, 6]);
  assert.ok(items.every(({ canEnroll }) => !canEnroll));
  await assert.rejects(api.enroll(4), /수강신청 기간/);

  now = window.startsAt;
  assert.ok((await api.courses()).items.every(({ canEnroll }) => canEnroll));
  const enrollment = await api.enroll(6);
  now = window.endsAt;
  await assert.rejects(api.enroll(4), /수강신청 기간/);
  await assert.rejects(api.cancelEnrollment(enrollment.id), /수강신청 기간/);
  assert.equal((await api.enrollments()).items.length, 1);
});
