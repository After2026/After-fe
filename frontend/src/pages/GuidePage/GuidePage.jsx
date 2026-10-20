import { Link } from "react-router-dom";
import "./GuidePage.css";

export default function GuidePage() {
  return (
    <section className="mm-guide-page" aria-labelledby="guide-title">
      <header className="mm-guide-page__hero">
        <span className="mm-guide-page__symbol" aria-hidden="true">★</span>
        <div>
          <p className="mm-guide-page__eyebrow">이용 안내</p>
          <h1 id="guide-title">‘오늘 국 짰다’ 이제 교실에서 끝나지 않아요</h1>
          <p>별점과 태그로 오늘의 한 끼를 기록해요. 친구들의 평가도 함께 확인할 수 있어요.</p>
        </div>
        <Link className="mm-guide-page__cta" to="/">평가하러 가기</Link>
      </header>

      <section className="mm-guide-page__card" aria-labelledby="guide-steps-title">
        <h2 id="guide-steps-title" className="mm-guide-page__card-heading">급식 평가, 이렇게 남겨요</h2>
        <ol className="mm-guide-page__steps">
          <li>
            <span className="mm-guide-page__step-number" aria-hidden="true">1</span>
            <div>
              <h3>먹은 메뉴 찾기</h3>
              <p>오늘의 메뉴에서 먹은 메뉴를 선택하고 상세 화면으로 이동해요.</p>
              <div className="mm-guide-page__example" aria-label="메뉴 표시 예시">
                <span aria-hidden="true">🍲</span> 제육볶음
                <span className="mm-guide-page__example-rating">★ 4.5</span>
              </div>
            </div>
          </li>
          <li>
            <span className="mm-guide-page__step-number" aria-hidden="true">2</span>
            <div>
              <h3>별점과 태그 선택하기</h3>
              <p>별점을 고르고 메뉴의 맛이나 양을 나타내는 태그를 선택해요.</p>
              <div className="mm-guide-page__sample-rating" aria-label="평가 예시: 별점 4점, 간 적당, 양 적다">
                <span className="mm-guide-page__stars" aria-hidden="true">★★★★☆</span>
                <span className="mm-guide-page__chip" aria-hidden="true">✓ 간 적당</span>
                <span className="mm-guide-page__chip" aria-hidden="true">✓ 양 적다</span>
              </div>
            </div>
          </li>
          <li>
            <span className="mm-guide-page__step-number" aria-hidden="true">3</span>
            <div>
              <h3>한마디 남기고 등록하기 <span>(댓글은 선택)</span></h3>
              <p>하고 싶은 말이 있다면 댓글을 적어 주세요. 평가 등록 버튼을 누르면 완료돼요.</p>
              <p className="mm-guide-page__small">위의 메뉴와 별점은 이용 방법을 설명하는 예시입니다.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="mm-guide-page__card mm-guide-page__rules" aria-labelledby="guide-rules-title">
        <h2 id="guide-rules-title">이렇게 써 주세요</h2>
        <p>음식에 관한 솔직한 의견은 좋아요. 욕설이나 특정인을 향한 비난은 삼가 주세요.</p>
        <div className="mm-guide-page__examples">
          <div className="mm-guide-page__good">
            <h3>✓ 좋은 예</h3>
            <p>“고기는 부드러웠는데 국이 좀 싱거웠어요.”</p>
            <p>“밥이 덜 익은 것 같아요. 확인 부탁드려요.”</p>
          </div>
          <div className="mm-guide-page__bad">
            <h3>✕ 피해주세요</h3>
            <p>특정인을 지목해 비난하는 글</p>
            <p>욕설·비속어 또는 개인정보가 포함된 글</p>
          </div>
        </div>
        <ul className="mm-guide-page__promises">
          <li>먹어 본 메뉴만 평가하기</li>
          <li>다른 사람을 존중하기</li>
          <li>개인정보 남기지 않기</li>
        </ul>
      </section>

      <aside className="mm-guide-page__ranking-note" aria-labelledby="guide-ranking-title">
        <h2 id="guide-ranking-title">인기 순위도 함께 살펴봐요</h2>
        <p>메뉴의 평균 별점과 평가 수, 많이 선택된 태그를 확인할 수 있어요. 별점과 평가 수를 함께 봐 주세요.</p>
        <Link to="/ranking">인기 순위 보기 →</Link>
      </aside>
    </section>
  );
}
