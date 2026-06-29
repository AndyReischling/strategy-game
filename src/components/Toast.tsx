import { useGame } from "../store/useGame";

export function Toast() {
  const notice = useGame((s) => s.notice);
  if (!notice) return null;
  return (
    <div className="toast card" role="status" aria-live="polite">
      {notice}
    </div>
  );
}
