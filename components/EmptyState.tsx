export function EmptyState({ integration = 'Integration' }: { integration?: string }) {
  return <div className="empty-state" aria-label={`${integration} empty state`}>
    <span>Mock data active</span>
    <span>Connect Supabase to save real data</span>
    <span>{integration} not connected yet</span>
  </div>;
}
