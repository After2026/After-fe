export const menus = [
  { id: 'pork', name: '제육볶음', emoji: '🍛' },
  { id: 'soup', name: '미역국', emoji: '🍲' },
  { id: 'salad', name: '양배추샐러드', emoji: '🥗' },
  { id: 'pudding', name: '망고푸딩', emoji: '🍮' },
];
export const tags = ['간 적당', '간 짜다', '간 싱겁다', '양 적당', '양 적다', '식감 좋음'];
const key = 'after.reviews.v1';
export function readReviews(storage = localStorage) {
  const raw = storage.getItem(key);
  if (!raw) return [];
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('저장된 평가를 읽지 못했어요. 브라우저 저장 데이터를 확인해 주세요.'); }
  if (!Array.isArray(data) || data.some(r => !r || !menus.some(m => m.id === r.menuId) || !Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5 || !Array.isArray(r.tags) || r.tags.some(t => !tags.includes(t)) || typeof r.comment !== 'string')) throw new Error('저장된 평가 형식이 올바르지 않아요.');
  return data;
}
export function saveReview(review, storage = localStorage) {
  if (!menus.some(m => m.id === review.menuId) || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 || !Array.isArray(review.tags) || review.tags.some(t => !tags.includes(t)) || typeof review.comment !== 'string' || review.comment.length > 300) throw new Error('메뉴와 별점, 평가 내용을 확인해 주세요.');
  const reviews = readReviews(storage);
  const item = { ...review, tags: [...new Set(review.tags)], comment: review.comment.trim() };
  const next = [...reviews.filter(r => r.menuId !== item.menuId), item];
  storage.setItem(key, JSON.stringify(next));
  return item;
}
export async function getRanking() {
  return rankReviews(readReviews());
}
export function rankReviews(reviews) {
  return menus.map(menu => {
    const items = reviews.filter(r => r.menuId === menu.id);
    const counts = new Map();
    items.forEach(r => r.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return { menuId: menu.id, menuName: menu.name, averageRating: items.reduce((sum, r) => sum + r.rating, 0) / (items.length || 1), reviewCount: items.length, topTags: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag) };
  }).filter(r => r.reviewCount).sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount).map((r, i) => ({ ...r, rank: i + 1 }));
}
