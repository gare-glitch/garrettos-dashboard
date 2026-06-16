export function MiniChart({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values);
  return <div className="mini-chart" aria-label={label}>{values.map((value, index) => <span key={`${value}-${index}`} style={{ height: `${Math.max(12, (value / max) * 100)}%` }} />)}</div>;
}
