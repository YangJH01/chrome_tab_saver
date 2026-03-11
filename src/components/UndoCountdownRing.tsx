type UndoCountdownRingProps = {
  durationMs: number;
  progressKey: number;
};

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function UndoCountdownRing({ durationMs, progressKey }: UndoCountdownRingProps) {
  return (
    <span className="undo-countdown-ring" aria-hidden="true">
      <svg className="undo-countdown-svg" viewBox="0 0 24 24">
        <circle className="undo-countdown-track" cx="12" cy="12" r={RADIUS} />
        <circle
          key={progressKey}
          className="undo-countdown-progress"
          cx="12"
          cy="12"
          r={RADIUS}
          style={
            {
              "--undo-circumference": CIRCUMFERENCE,
              "--undo-duration": `${durationMs}ms`
            } as React.CSSProperties
          }
        />
      </svg>
    </span>
  );
}
