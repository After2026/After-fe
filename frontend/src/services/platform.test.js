import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../lib/demo.js";
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
  const responses = [1, 2, 3].map((slotId) => ({
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
  assert.equal((await reloaded.vote(2)).responses.length, 3);
});
test("ineligible, expired and duplicate-slot ballots rejected", async () => {
  const storage = memory(),
    api = createDemo(storage);
  await api.submitVote(2, {
    responses: [1, 2, 3].map((slotId) => ({
      slotId,
      availability: "ADJUSTABLE",
    })),
  });
  const state = JSON.parse(storage.getItem("after.voting.v1"));
  state.interests[2] = { intentLevel: 3 };
  storage.setItem("after.voting.v1", JSON.stringify(state));
  await assert.rejects(api.submitVote(2, { responses: [] }));
  state.interests[2] = { intentLevel: 1 };
  state.proposals[1].voteDeadline = "2020-01-01";
  storage.setItem("after.voting.v1", JSON.stringify(state));
  await assert.rejects(
    api.submitVote(2, {
      responses: [1, 2, 3].map((slotId) => ({
        slotId,
        availability: "AVAILABLE",
      })),
    }),
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
