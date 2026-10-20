import "./state.css";

/** message: 로딩 안내 문구 */
export default function Loading({ message = "불러오는 중이에요." }) {
  return (
    <div className="mm-state" role="status" aria-live="polite">
      <span className="mm-state__spinner" aria-hidden="true" />
      <p className="mm-state__message">{message}</p>
    </div>
  );
}
