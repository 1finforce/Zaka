export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 rounded-lg bg-line mb-3" />
      <div className="h-4 w-72 max-w-full rounded bg-line mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl2 bg-line" />)}</div>
      <div className="h-64 rounded-xl2 bg-line mt-6" />
    </div>
  );
}
