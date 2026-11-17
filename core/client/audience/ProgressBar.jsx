/** A thin bar across the top of the window, above the stage, filling as the talk advances. */
export default function ProgressBar({ current, total }) {
  const pct = total > 1 ? ((current) / (total - 1)) * 100 : 0;
  return (
    <div className="progress-track">
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
