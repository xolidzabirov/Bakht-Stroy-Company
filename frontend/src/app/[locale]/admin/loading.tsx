/** Shown at once while an admin page loads its data, so a click (or the sign-in) never looks frozen. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" className="animate-pulse space-y-4">
      <div className="h-9 w-56 rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-muted" />
    </div>
  );
}
