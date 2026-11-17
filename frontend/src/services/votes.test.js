import test from 'node:test';
import assert from 'node:assert/strict';
import { readReviews, saveReview, rankReviews } from './votes.js';
const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v) }; };
test('votes persist, edit replaces previous vote, and rankings reflect saved ratings', () => {
  const storage = memory();
  saveReview({ menuId:'pork', rating:3, tags:['간 적당'], comment:'좋아요' },storage);
  saveReview({ menuId:'pork', rating:5, tags:['간 적당'], comment:'수정' },storage);
  saveReview({ menuId:'soup', rating:4, tags:[], comment:'' },storage);
  const reviews = readReviews(storage);
  assert.equal(reviews.length,2);
  assert.deepEqual(rankReviews(reviews).map(r => [r.menuId,r.averageRating,r.reviewCount,r.rank]), [['pork',5,1,1],['soup',4,1,2]]);
});
test('invalid ratings and unreadable storage do not overwrite votes', () => {
  const storage = memory();
  assert.throws(() => saveReview({menuId:'pork',rating:0,tags:[],comment:''},storage));
  storage.setItem('after.reviews.v1','invalid');
  assert.throws(() => readReviews(storage));
  assert.throws(() => saveReview({menuId:'pork',rating:5,tags:[],comment:''},storage));
  assert.equal(storage.getItem('after.reviews.v1'),'invalid');
});
