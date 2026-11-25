import test from "node:test";
import assert from "node:assert/strict";
import { createDemo, seed } from "../lib/demo.js";
import { createClient } from "../lib/api.js";
function memory() {
  const s = new Map();
  return { getItem: (k) => s.get(k) ?? null, setItem: (k, v) => s.set(k, v) };
}
test("interest eligibility, voting all slots and replacement survive reload", async () => {
  const storage = memory(),
    api = createDemo(storage);
  await assert.rejects(api.interest(2, { intentLevel: 1, comment: "" }));
  await api.interest(1, { intentLevel: 1, comment: "배우고 싶어요" });
  assert.equal((await api.detail(1)).interestCount, 19);
  await api.interest(1, { intentLevel: 2, comment: "" });
  assert.equal((await api.detail(1)).interestCount, 19);
  await api.cancelInterest(1);
  assert.equal((await api.detail(1)).interestCount, 18);
  await assert.rejects(
    api.submitVote(2, {
      responses: [{ slotId: 1, availability: "AVAILABLE" }],
    }),
  );
  const responses = [1, 2].map((slotId) => ({
    slotId,
    availability: "AVAILABLE",
  }));
  await api.submitVote(2, { responses });
  responses[0].availability = "UNAVAILABLE";
  await api.submitVote(2, { responses });
  const reloaded = createDemo(storage),
    result = await reloaded.result(2);
  assert.equal(result.totalRespondents, 1);
  assert.equal(result.slots[0].availableCount, 0);
  assert.equal(result.slots[0].unavailableCount, 1);
  assert.equal((await reloaded.vote(2)).responses.length, 2);
});
test("ineligible, expired and duplicate-slot ballots rejected", async () => {
  const storage = memory(),
    api = createDemo(storage);
  await api.submitVote(2, {
    responses: [1, 2].map((slotId) => ({
      slotId,
      availability: "ADJUSTABLE",
    })),
  });
  await assert.rejects(
    api.submitVote(2, {
      responses: [1, 1].map((slotId) => ({
        slotId,
        availability: "AVAILABLE",
      })),
    }),
    /모든 후보 시간/,
  );
  const state = JSON.parse(storage.getItem("after.voting.v1"));
  state.interests[2] = { intentLevel: 3 };
  storage.setItem("after.voting.v1", JSON.stringify(state));
  await assert.rejects(api.submitVote(2, { responses: [] }));
  state.interests[2] = { intentLevel: 1 };
  state.proposals[1].voteDeadline = "2020-01-01";
  storage.setItem("after.voting.v1", JSON.stringify(state));
  await assert.rejects(
    api.submitVote(2, {
      responses: [1, 2].map((slotId) => ({
        slotId,
        availability: "AVAILABLE",
      })),
    }),
  );
});
test("older demo votes keep Monday and Wednesday after Friday is removed", async () => {
  const storage = memory();
  const state = seed();
  state.proposals
    .find(({ id }) => id === 2)
    .slots.push({ id: 3, day: "금요일", period: 9 });
  state.votes[2] = [
    { slotId: 1, availability: "AVAILABLE" },
    { slotId: 2, availability: "ADJUSTABLE" },
    { slotId: 3, availability: "UNAVAILABLE" },
  ];
  storage.setItem("after.voting.v1", JSON.stringify(state));

  const api = createDemo(storage);
  const vote = await api.vote(2);
  assert.deepEqual(
    vote.slots.map(({ day }) => day),
    ["월요일", "수요일"],
  );
  assert.deepEqual(vote.responses, state.votes[2].slice(0, 2));
  const result = await api.result(2);
  assert.equal(result.totalRespondents, 1);
  assert.deepEqual(
    result.slots.map(({ day }) => day),
    ["월요일", "수요일"],
  );
  await api.submitVote(2, { responses: vote.responses });
  assert.deepEqual(
    (await createDemo(storage).vote(2)).responses,
    vote.responses,
  );
});
test("cookie auth refreshes expired token and retries exact vote body", async () => {
  const calls = [];
  const fetcher = async (url, opts) => {
    calls.push([url, opts]);
    return calls.length === 1
      ? new Response(JSON.stringify({ error: { code: "TOKEN_EXPIRED" } }), {
          status: 401,
        })
      : new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  await createClient("/api/v1", fetcher).submitVote(2, { responses: [] });
  assert.deepEqual(
    calls.map((c) => c[0]),
    [
      "/api/v1/proposals/2/vote",
      "/api/v1/auth/refresh",
      "/api/v1/proposals/2/vote",
    ],
  );
  assert.ok(calls.every((c) => c[1].credentials === "include"));
  assert.equal(calls[0][1].body, calls[2][1].body);
  assert.equal(calls[0][1].method, "PUT");
  assert.equal(calls[0][1].headers.Authorization, undefined);
});
test("API errors never fall back to fake success or demo data", async () => {
  const api = createClient(
    "/api/v1",
    async () =>
      new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "자격 없음" } }),
        { status: 403 },
      ),
  );
  await assert.rejects(api.submitVote(2, { responses: [] }), /자격 없음/);
});

test("enrollment is persistent, rejects duplicate and closed courses, and cancels", async () => {
  const storage = memory(),
    api = createDemo(storage);
  await assert.rejects(api.enroll(1));
  await assert.rejects(api.enroll(6));
  const enrollment = await api.enroll(4);
  await assert.rejects(api.enroll(4));
  assert.equal((await createDemo(storage).enrollments()).items.length, 1);
  await api.cancelEnrollment(enrollment.id);
  assert.equal((await api.enrollments()).items.length, 0);
});
test("review validates required reasons and approved survey deadline", async () => {
  const api = createDemo(memory());
  await assert.rejects(api.review(1, { action: "REJECT", reason: "" }));
  await assert.rejects(
    api.review(1, {
      action: "APPROVE",
      threshold: 12,
      surveyDeadline: "2020-01-01",
    }),
  );
  await api.review(1, {
    action: "APPROVE",
    threshold: 12,
    surveyDeadline: new Date(Date.now() + 86400000).toISOString(),
    reason: "",
  });
  assert.equal((await api.detail(1)).threshold, 12);
});

test("demo opens logged out and starts only through explicit entry, then logout persists", async () => {
  const storage = memory(),
    session = memory(),
    api = createDemo(storage, session);
  await assert.rejects(api.me(), (e) => e.status === 401);
  await api.startDemo();
  assert.equal((await createDemo(storage, session).me()).role, "STUDENT");
  await api.logout();
  await assert.rejects(
    createDemo(storage, session).me(),
    (e) => e.status === 401,
  );
});

test("course counts and progress source grow after enrollment and shrink after cancellation", async () => {
  const api = createDemo(memory());
  const before = (await api.courses()).items.find((c) => c.id === 4);
  const enrollment = await api.enroll(4);
  const after = (await api.courses()).items.find((c) => c.id === 4);
  assert.equal(after.enrollmentCount, before.enrollmentCount + 1);
  assert.equal((await api.enrollments()).items.length, 1);
  await api.cancelEnrollment(enrollment.id);
  assert.equal(
    (await api.courses()).items.find((c) => c.id === 4).enrollmentCount,
    before.enrollmentCount,
  );
});
test("opening an interested class creates one persistent notification with read state", async () => {
  const storage = memory(),
    api = createDemo(storage);
  await api.interest(1, { intentLevel: 2, comment: "" });
  assert.equal((await api.unreadCount()).count, 0);
  const state = JSON.parse(storage.getItem("after.voting.v1"));
  state.proposals.find((p) => p.id === 1).status = "CONFIRMED";
  storage.setItem("after.voting.v1", JSON.stringify(state));
  assert.equal((await api.unreadCount()).count, 1);
  const alerts = await createDemo(storage).notifications();
  assert.equal(alerts.items[0].proposalId, 1);
  assert.equal((await api.notifications()).items.length, 1);
  await api.readNotification(alerts.items[0].id);
  assert.equal((await api.unreadCount()).count, 0);
  assert.equal((await createDemo(storage).notifications()).items[0].read, true);
});
