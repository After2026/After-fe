import { Link } from "react-router-dom";
import "./RankingPage.css";

// items: 서버 순서대로 표시할 순위 배열. menuId가 있을 때만 상세 링크 표시.
export default function RankingTable({ items = [] }) {
  return (
    <div
      className="mm-ranking-table__scroll"
      role="region"
      aria-label="인기 순위 표. 화면이 좁으면 좌우로 스크롤할 수 있어요."
      tabIndex={0}
    >
      <table className="mm-ranking-table">
        <caption className="mm-ranking-table__sr-only">
          메뉴 인기 순위, 평균 별점 높은 순
        </caption>
        <thead>
          <tr>
            <th scope="col">순위</th>
            <th scope="col">메뉴 이름</th>
            <th scope="col">평균 별점</th>
            <th scope="col">평가 수</th>
            <th scope="col">가장 많이 선택된 태그</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.menuName}>
              <td>
                <span className={`mm-ranking-table__rank${item.rank <= 3 ? " mm-ranking-table__rank--top" : ""}`}>
                  {item.rank}<span className="mm-ranking-table__sr-only">위</span>
                </span>
              </td>
              <th scope="row" className="mm-ranking-table__name">
                {item.menuId != null ? (
                  <Link to={`/menu/${encodeURIComponent(item.menuId)}`}>{item.menuName}</Link>
                ) : item.menuName}
              </th>
              <td className="mm-ranking-table__rating">
                <span className="mm-ranking-table__star" aria-hidden="true">★ </span>
                <span className="mm-ranking-table__sr-only">5점 만점에 </span>
                {item.averageRating.toFixed(1)}
                <span className="mm-ranking-table__sr-only">점</span>
              </td>
              <td className="mm-ranking-table__count">{item.reviewCount.toLocaleString("ko-KR")}개</td>
              <td>
                {item.topTags.length > 0 ? (
                  <ul className="mm-ranking-table__tags">
                    {[...new Set(item.topTags)].map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                ) : <span className="mm-ranking-table__count">선택된 태그 없음</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
