export const DEFAULT_MOTIVATIONS = [
  "Build the life you imagined.",
  "Discipline is the bridge between goals and accomplishment.",
  "Small disciplines repeated with consistency lead to great achievements.",
  "The secret of getting ahead is getting started.",
  "Calm mind. Clear plan. Steady hands.",
  "What you do every day matters more than what you do once in a while.",
  "You don't have to be extreme, just consistent.",
  "A year from now you will wish you had started today.",
  "Master the mundane, and the extraordinary follows.",
  "Become the architect of your own story.",
];

/** Deterministic pick per day so the message feels intentional, not random. */
export function motivationFor(dateKey: string, list: string[] = DEFAULT_MOTIVATIONS): string {
  const pool = list.length > 0 ? list : DEFAULT_MOTIVATIONS;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}
