import "./state.css";

/** title: 제목 / message: 설명. message=""로 설명을 숨길 수 있습니다. */
export default function EmptyState({
  title = "아직 표시할 내용이 없어요.",
  message = "데이터가 등록되면 여기에 표시됩니다.",
}) {
  return (
    <div className="mm-state mm-state--empty" role="status" aria-live="polite">
      <strong className="mm-state__title">{title}</strong>
      {message && <p className="mm-state__message">{message}</p>}
    </div>
  );
}
