import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../lib/demo.js";

function memory() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const opensAt = Date.parse("2026-11-25T03:00:00Z");
const voteEndAt = "2026-11-26T03:00:00.000Z";
const inGrade = [1];
const outsideGrade = [2, 3];

async function submitDraft(api, targetGrades = inGrade) {
  const draft = await api.create({
    title: "로봇 만들기",
    description: "센서로 움직이는 로봇을 함께 만들어요.",
    category: "IT",
    targetGrades,
  });
  await api.submitProposal(draft.id);
  return draft.id;
}

test("teacher acceptance opens a ballot for the target grade without a survey", async () => {
  const storage = memory();
  const session = memory();
  const api = createDemo(storage, session, { now: () => opensAt });
  await api.startDemo();
  const id = await submitDraft(api);
  const outOfGradeId = await submitDraft(api, outsideGrade);
  const teacher = await api.startTeacherDemo();
  assert.equal(teacher.role, "TEACHER");
  assert.equal((await createDemo(storage, session).me()).role, "TEACHER");
  assert.equal((await api.teacherProposals()).items.find((p) => p.id === id).status, "SUBMITTED");
  const { items } = await api.timeSlots();
  assert.deepEqual(items.map((slot) => slot.dayOfWeek), ["MONDAY", "WEDNESDAY"]);
  assert.deepEqual(items.map((slot) => slot.label), ["월요일 8교시~10교시", "수요일 8교시~10교시"]);
  const timeSlotIds = items.map(({ id }) => id);
  await api.acceptProposal(id, { timeSlotIds, voteEndAt });
  await api.acceptProposal(outOfGradeId, { timeSlotIds, voteEndAt });
  assert.equal((await api.vote(id)).canVote, false);

  await api.startDemo();
  const ballot = await api.vote(id);
  assert.equal(ballot.requiresInterest, false);
  assert.equal(ballot.canVote, true);
  assert.equal(ballot.deadline, voteEndAt);
  assert.equal((await api.detail(id)).myInterest, null);
  assert.equal((await api.detail(id)).surveyDeadline, undefined);
  assert.equal((await api.detail(id)).threshold, undefined);
  assert.ok((await api.votableProposals()).items.some((p) => p.id === id));
  assert.ok(!(await api.votableProposals()).items.some((p) => p.id === outOfGradeId));
  assert.equal((await api.vote(outOfGradeId)).canVote, false);
  const responses = timeSlotIds.map((slotId) => ({ slotId, availability: "AVAILABLE" }));
  await assert.rejects(api.submitVote(outOfGradeId, { responses }));
  await api.submitVote(id, { responses });
  assert.equal((await api.result(id)).totalRespondents, 1);
});

test("only the responsible teacher can confirm a voting candidate after the deadline", async () => {
  let clock = opensAt;
  const storage = memory();
  const session = memory();
  const api = createDemo(storage, session, { now: () => clock });
  await api.startDemo();
  const id = await submitDraft(api);
  const { items: slots } = await api.timeSlots();
  const timeSlotIds = slots.map(({ id }) => id);
  await assert.rejects(api.teacherProposals(), { status: 403 });
  await assert.rejects(api.acceptProposal(id, { timeSlotIds, voteEndAt }), { status: 403 });
  await api.logout();
  await assert.rejects(api.acceptProposal(id, { timeSlotIds, voteEndAt }), { status: 401 });

  const teacher = await api.startTeacherDemo();
  await assert.rejects(api.acceptProposal(id, { timeSlotIds: [], voteEndAt }));
  await assert.rejects(api.acceptProposal(id, { timeSlotIds, voteEndAt: "invalid" }));
  await assert.rejects(api.acceptProposal(id, { timeSlotIds, voteEndAt: new Date(clock).toISOString() }));
  await api.acceptProposal(id, { timeSlotIds: [slots[0].id], voteEndAt });
  await assert.rejects(api.acceptProposal(id, { timeSlotIds, voteEndAt }));
  await assert.rejects(api.confirmProposal(id, { timeSlotId: slots[0].id }));
  await api.startDemo();
  await api.submitVote(id, { responses: [{ slotId: slots[0].id, availability: "AVAILABLE" }] });
  clock = Date.parse(voteEndAt);
  assert.equal((await api.vote(id)).canVote, false);
  await assert.rejects(api.submitVote(id, { responses: [{ slotId: slots[0].id, availability: "AVAILABLE" }] }));
  await assert.rejects(api.confirmProposal(id, { timeSlotId: slots[0].id }), { status: 403 });

  await api.startTeacherDemo();
  await assert.rejects(api.confirmProposal(2, { timeSlotId: slots[0].id }), { status: 403 });
  await assert.rejects(api.confirmProposal(id, { timeSlotId: slots[1].id }));
  const course = await api.confirmProposal(id, { timeSlotId: slots[0].id });
  assert.equal(course.status, "CONFIRMED");
  assert.equal(course.instructorName, teacher.name);
  assert.equal(course.courseTime, slots[0].label);
  assert.ok((await api.teacherProposals()).items.some((p) => p.id === id && p.status === "CONFIRMED"));
  assert.ok((await api.courses()).items.some((p) => p.id === id && p.canEnroll === false));
  await assert.rejects(api.confirmProposal(id, { timeSlotId: slots[0].id }));
  assert.equal((await api.notifications()).items.length, 0);
  await api.startDemo();
  assert.ok((await api.notifications()).items.some((n) => n.proposalId === id));
});

test("early closing stops submissions, preserves results, and unlocks confirmation", async () => {
  const api = createDemo(memory(), memory(), { now: () => opensAt });
  await api.startDemo();
  const id = await submitDraft(api);
  assert.equal((await api.detail(id)).interestCount, 0);
  const { items: [slot] } = await api.timeSlots();
  const responses = [{ slotId: slot.id, availability: "AVAILABLE" }];

  await api.startTeacherDemo();
  await api.acceptProposal(id, { timeSlotIds: [slot.id], voteEndAt });
  await assert.rejects(api.closeProposalVote(2), { status: 403 });
  await api.startDemo();
  await api.submitVote(id, { responses });
  await assert.rejects(api.closeProposalVote(id), { status: 403 });

  await api.startTeacherDemo();
  const closed = await api.closeProposalVote(id);
  assert.equal(closed.status, "REVIEWING");
  assert.equal(closed.voteDeadline, new Date(opensAt).toISOString());
  assert.equal((await api.result(id)).totalRespondents, 1);
  await assert.rejects(api.closeProposalVote(id));

  await api.startDemo();
  await assert.rejects(api.submitVote(id, { responses }));
  await api.startTeacherDemo();
  assert.equal((await api.confirmProposal(id, { timeSlotId: slot.id })).status, "CONFIRMED");
});

test("a published proposal is immediately available for interest and teacher acceptance", async () => {
  const api = createDemo(memory(), memory(), { now: () => opensAt });
  await api.startDemo();
  const proposal = await api.create({
    title: "팀 프로젝트",
    description: "팀으로 실습할 프로젝트를 제안해요.",
    category: "IT",
    targetGrades: inGrade,
    publishForSurvey: true,
  });
  assert.equal(proposal.status, "SURVEYING");
  assert.equal(proposal.interestCount, 0);
  assert.equal(proposal.awaitingTeacher, true);
  assert.ok((await api.list({ status: "SURVEYING" })).items.some(({ id }) => id === proposal.id));
  await assert.rejects(api.interest(proposal.id, { intentLevel: 3 }), { status: 403 });
  assert.equal((await api.detail(proposal.id)).myInterest, null);
  assert.equal((await api.detail(proposal.id)).interestCount, 0);

  await api.startTeacherDemo();
  assert.ok((await api.teacherProposals()).items.some(({ id }) => id === proposal.id));
  const { items: [slot] } = await api.timeSlots();
  const voting = await api.acceptProposal(proposal.id, { timeSlotIds: [slot.id], voteEndAt });
  assert.equal(voting.status, "VOTING");
  assert.equal(voting.awaitingTeacher, false);
  await api.startDemo();
  assert.equal((await api.vote(proposal.id)).canVote, true);
  await assert.rejects(api.interest(proposal.id, { intentLevel: 3 }));
});

test("the author can edit a published or submitted proposal until voting starts", async () => {
  const api = createDemo(memory(), memory(), { now: () => opensAt });
  const draft = {
    title: "환경 관찰 프로젝트",
    description: "학교 주변의 생물을 기록해요.",
    category: "SUBJECT",
    targetGrades: inGrade,
  };
  await api.startDemo();
  const published = await api.create({ ...draft, publishForSurvey: true });
  const edited = await api.updateProposal(published.id, { ...draft, title: "학교 생태 프로젝트" });
  assert.equal(edited.title, "학교 생태 프로젝트");
  assert.equal(edited.status, "SURVEYING");
  assert.equal(edited.awaitingTeacher, true);
  const submitted = await submitDraft(api);
  assert.equal((await api.updateProposal(submitted, draft)).status, "SUBMITTED");
  await assert.rejects(api.updateProposal(1, draft), { status: 403 });

  await api.startTeacherDemo();
  const { items: [slot] } = await api.timeSlots();
  await api.acceptProposal(published.id, { timeSlotIds: [slot.id], voteEndAt });
  await api.startDemo();
  await assert.rejects(api.updateProposal(published.id, draft), { status: 422 });
  assert.equal((await api.detail(published.id)).title, "학교 생태 프로젝트");
});

test("the author can delete a proposal before voting and removed proposals disappear from lists", async () => {
  const api = createDemo(memory(), memory(), { now: () => opensAt });
  await api.startDemo();
  const proposal = await api.create({
    title: "독서 모임",
    description: "한 권을 골라 같이 읽고 토론해요.",
    category: "SUBJECT",
    targetGrades: inGrade,
    publishForSurvey: true,
  });
  await assert.rejects(api.deleteProposal(1), { status: 403 });
  assert.equal((await api.deleteProposal(proposal.id)).status, "ARCHIVED");
  assert.ok(!(await api.myProposals()).items.some(({ id }) => id === proposal.id));
  assert.ok(!(await api.myInterests()).items.some(({ id }) => id === proposal.id));
  assert.ok(!(await api.list()).items.some(({ id }) => id === proposal.id));
  await assert.rejects(api.detail(proposal.id), { status: 404 });

  const submitted = await submitDraft(api);
  await api.startTeacherDemo();
  assert.ok(!(await api.teacherProposals()).items.some(({ id }) => id === proposal.id));
  const { items: [slot] } = await api.timeSlots();
  await api.acceptProposal(submitted, { timeSlotIds: [slot.id], voteEndAt });
  await api.startDemo();
  await assert.rejects(api.deleteProposal(submitted), { status: 422 });
});

test("old demo proposals drop the author's automatic interest without changing other counts", async () => {
  const storage = memory();
  const api = createDemo(storage, memory(), { now: () => opensAt });
  await api.startDemo();
  const id = await submitDraft(api);
  const state = JSON.parse(storage.getItem("after.voting.v1"));
  delete state.interestCountsExcludeProposer;
  state.proposals.find((p) => p.id === id).interestCount = 1;
  state.interests[id] = { intentLevel: 2 };
  storage.setItem("after.voting.v1", JSON.stringify(state));

  assert.equal((await api.detail(id)).interestCount, 0);
  assert.equal((await api.detail(id)).myInterest, null);
  assert.ok(!(await api.myInterests()).items.some((p) => p.id === id));
  assert.equal((await api.detail(1)).interestCount, 18);
});
