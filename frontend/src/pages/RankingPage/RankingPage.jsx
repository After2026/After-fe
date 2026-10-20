import { useEffect, useState } from "react";
import Loading from "../../components/state/Loading";
import ErrorMessage from "../../components/state/ErrorMessage";
import EmptyState from "../../components/state/EmptyState";
import RankingTable from "./RankingTable";
import "./RankingPage.css";

// 화면 개발용 예시입니다. 실제 서버 응답과 필드명을 합의한 뒤 연결하세요.
const DEMO_RANKING = [
  { rank: 1, menuName: "망고푸딩", averageRating: 4.8, reviewCount: 53, topTags: ["식감 부드러움", "온도 적당"] },
  { rank: 2, menuName: "조미김", averageRating: 4.8, reviewCount: 20, topTags: ["양 적당", "간 짜다"] },
  { rank: 3, menuName: "비엔나야채볶음", averageRating: 4.7, reviewCount: 43, topTags: ["식감 적당"] },
  { rank: 4, menuName: "양배추샐러드", averageRating: 4.6, reviewCount: 20, topTags: ["온도 적당"] },
  { rank: 5, menuName: "제육볶음", averageRating: 4.5, reviewCount: 52, topTags: ["간 적당", "양 적다"] },
  { rank: 6, menuName: "치즈돈가스", averageRating: 4.4, reviewCount: 61, topTags: ["식감 바삭함", "간 적당"] },
  { rank: 7, menuName: "떡볶이", averageRating: 4.2, reviewCount: 58, topTags: ["간 짜다", "양 적다"] },
];

async function getDemoRanking() {
  return DEMO_RANKING;
}

// 같은 이름의 메뉴는 서버에서 합산한다는 프로젝트 계약을 따릅니다.
function validateRanking(data) {
  if (!Array.isArray(data)) throw new Error("순위 데이터 형식을 확인해 주세요.");
  const menuNames = new Set();

  for (const item of data) {
    const valid = item &&
      Number.isInteger(item.rank) && item.rank > 0 &&
      typeof item.menuName === "string" && item.menuName.trim().length > 0 &&
      Number.isFinite(item.averageRating) && item.averageRating >= 0 && item.averageRating <= 5 &&
      Number.isInteger(item.reviewCount) && item.reviewCount >= 0 &&
      Array.isArray(item.topTags) &&
      item.topTags.every((tag) => typeof tag === "string" && tag.trim().length > 0) &&
      (item.menuId == null ||
        (typeof item.menuId === "string" && item.menuId.trim().length > 0) ||
        (Number.isInteger(item.menuId) && item.menuId >= 0));

    if (!valid || menuNames.has(item.menuName.trim())) {
      throw new Error("순위 데이터 형식을 확인해 주세요.");
    }
    menuNames.add(item.menuName.trim());
  }
  return data;
}

// 실제 연결: <RankingPage loadRanking={getRanking} />
export default function RankingPage({ loadRanking = getDemoRanking }) {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState({
    loader: loadRanking, status: "loading", items: [], message: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setState({ loader: loadRanking, status: "loading", items: [], message: "" });
      try {
        const items = validateRanking(await loadRanking());
        if (active) {
          setState({ loader: loadRanking, status: "success", items, message: "" });
        }
      } catch (error) {
        if (active) {
          setState({
            loader: loadRanking,
            status: "error",
            items: [],
            message: error instanceof Error && error.message
              ? error.message : "인기 순위를 불러오지 못했어요.",
          });
        }
      }
    }

    load();
    return () => { active = false; };
  }, [loadRanking, retryCount]);

  // loader 교체나 재시도 직후에도 오래된 화면을 보여주지 않습니다.
  const status = state.loader === loadRanking ? state.status : "loading";
  const retry = () => {
    setState({ loader: loadRanking, status: "loading", items: [], message: "" });
    setRetryCount((count) => count + 1);
  };

  return (
    <section className="mm-ranking-page" aria-labelledby="ranking-title">
      <header className="mm-ranking-page__header">
        <p className="mm-ranking-page__eyebrow">누적 평가 기준</p>
        <h1 id="ranking-title">인기 순위</h1>
        <p>지금까지 쌓인 평가를 평균 별점이 높은 순서로 보여 줘요.</p>
        {loadRanking === getDemoRanking && (
          <p className="mm-ranking-page__demo">예시 데이터 · 실제 급식 평가가 아닙니다.</p>
        )}
      </header>

      <div aria-busy={status === "loading"}>
        {status === "loading" && <Loading message="인기 순위를 불러오고 있어요." />}
        {status === "error" && <ErrorMessage message={state.message} onRetry={retry} />}
        {status === "success" && (state.items.length === 0
          ? <EmptyState title="아직 인기 순위가 없어요." message="메뉴 평가가 모이면 순위를 확인할 수 있어요." />
          : <RankingTable items={state.items} />)}
      </div>

      <p className="mm-ranking-page__note">
        평균 별점과 평가 수를 함께 확인해 주세요. 같은 이름의 메뉴는 날짜에 관계없이 합산됩니다.
      </p>
    </section>
  );
}
