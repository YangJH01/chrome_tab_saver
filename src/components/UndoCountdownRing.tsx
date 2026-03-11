type UndoCountdownRingProps = {
  durationMs: number;
  progressKey: number;
};

const RADIUS = 9;

export function UndoCountdownRing({ durationMs, progressKey }: UndoCountdownRingProps) {
  return (
    <span className="undo-countdown-ring" aria-hidden="true">
      <svg className="undo-countdown-svg" viewBox="0 0 24 24">
        <circle className="undo-countdown-track" cx="12" cy="12" r={RADIUS} pathLength="100" />
        <circle
          key={progressKey}
          className="undo-countdown-progress"
          cx="12"
          cy="12"
          r={RADIUS}
          pathLength="100"
          style={
            {
              "--undo-duration": `${durationMs}ms`
            } as React.CSSProperties
          }
        />
      </svg>
    </span>
  );
}
