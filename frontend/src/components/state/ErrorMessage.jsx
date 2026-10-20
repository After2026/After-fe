import "./state.css";

/** message: 오류 안내 / onRetry: 재시도 함수(선택) */
export default function ErrorMessage({
  message = "정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  onRetry,
}) {
  return (
    <div className="mm-state mm-state--error" role="alert">
      <strong className="mm-state__title">문제가 발생했어요.</strong>
      <p className="mm-state__message">{message}</p>
      {typeof onRetry === "function" && (
        <button className="mm-state__retry" type="button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}
