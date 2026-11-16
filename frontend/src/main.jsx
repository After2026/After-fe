import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, Link, Routes, Route, useParams } from 'react-router-dom';
import { useState } from 'react';
import GuidePage from './pages/GuidePage/GuidePage';
import RankingPage from './pages/RankingPage/RankingPage';
import { menus, tags, readReviews, saveReview, getRanking } from './services/votes';
import './style.css';

function Home() {
  return <section><p className="eyebrow">오늘의 한 끼, 나의 한 표</p><h1>오늘 급식은 어땠나요?</h1><p>메뉴를 선택하고 별점과 태그로 평가해 주세요.</p><div className="menu-grid">{menus.map(m => <Link className="menu-card" key={m.id} to={`/menu/${m.id}`}><span aria-hidden="true">{m.emoji}</span><h2>{m.name}</h2><p>평가하러 가기 →</p></Link>)}</div></section>;
}
function VoteForm({ menu }) {
  const [initial] = useState(() => { try { return { review: readReviews().find(r => r.menuId === menu.id) }; } catch (e) { return { error: e.message }; } });
  const [rating, setRating] = useState(initial.review?.rating || 0);
  const [selected, setSelected] = useState(initial.review?.tags || []);
  const [comment, setComment] = useState(initial.review?.comment || '');
  const [error, setError] = useState(initial.error || '');
  const [saved, setSaved] = useState(false);
  function submit(e) {
    e.preventDefault(); setSaved(false);
    try { saveReview({ menuId: menu.id, rating, tags: selected, comment }); setError(''); setSaved(true); }
    catch (e) { setError(e.message || '평가를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); }
  }
  return <section className="vote"><Link to="/">← 메뉴 목록</Link><h1>{menu.emoji} {menu.name}</h1><p>메뉴별로 한 번 평가하며, 다시 등록하면 이전 평가를 수정합니다.</p><form onSubmit={submit} onChange={() => setSaved(false)}><fieldset><legend>별점 (필수)</legend><div className="choices">{[1,2,3,4,5].map(n => <label key={n}><input required type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />{n}점</label>)}</div></fieldset><fieldset><legend>어떤 점이 기억에 남나요? (선택)</legend><div className="choices">{tags.map(t => <label key={t}><input type="checkbox" checked={selected.includes(t)} onChange={e => setSelected(e.target.checked ? [...selected, t] : selected.filter(s => s !== t))} />{t}</label>)}</div></fieldset><label className="comment">한마디 (선택, 최대 300자)<textarea maxLength={300} value={comment} onChange={e => setComment(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<button type="submit">평가 등록</button>{saved && <div role="status"><p>평가를 저장했어요!</p><Link to="/ranking">인기 순위 확인 →</Link></div>}</form></section>;
}
function Menu() { const { id } = useParams(); const menu = menus.find(m => m.id === id); return menu ? <VoteForm key={id} menu={menu} /> : <NotFound />; }
function NotFound() { return <section><h1>페이지를 찾을 수 없어요.</h1><Link to="/">메뉴 목록으로</Link></section>; }
function App() {
  return <><header className="site-header"><Link className="brand" to="/">After</Link><nav aria-label="주 메뉴"><NavLink to="/" end>급식 평가</NavLink><NavLink to="/ranking">인기 순위</NavLink><NavLink to="/guide">이용 안내</NavLink></nav></header><main><aside className="notice">체험 모드 · 예시 메뉴입니다. 평가는 이 브라우저에만 저장되며 다른 사용자와 공유되지 않습니다.</aside><Routes><Route path="/" element={<Home />} /><Route path="/menu/:id" element={<Menu />} /><Route path="/ranking" element={<RankingPage loadRanking={getRanking} />} /><Route path="/guide" element={<GuidePage />} /><Route path="*" element={<NotFound />} /></Routes></main><footer>After · 오늘의 급식을 함께 기록해요</footer></>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
