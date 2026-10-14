/**
 * Renders a listing description as the agent wrote it.
 *
 * V-Star's descriptions are written the way listings circulate on WhatsApp:
 * a sentence or two, then one feature per line ("3 bedrooms", "Fully AC").
 * Run together into one paragraph that reads as a wall of fragments, so
 * sentences stay paragraphs and runs of short feature lines become a list.
 */
const FEATURE_MAX = 72;

function isFeature(line: string): boolean {
  if (line.startsWith('- ')) return true;
  // Short, unpunctuated lines are features; sentences end in a full stop.
  return line.length <= FEATURE_MAX && !/[.!?]$/.test(line);
}

type Block = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] };

function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (isFeature(line)) {
      const item = line.replace(/^-\s*/, '');
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'ul') last.items.push(item);
      else blocks.push({ kind: 'ul', items: [item] });
    } else {
      blocks.push({ kind: 'p', text: line });
    }
  }
  // A lone short line between paragraphs reads better as text than as a
  // one-item list (a heading-like "Upstairs:" or "Asking price").
  return blocks.map((b) =>
    b.kind === 'ul' && b.items.length === 1 ? { kind: 'p', text: b.items[0] } : b,
  );
}

export default function ListingDescription({ text }: { text: string }) {
  const blocks = toBlocks(text);
  return (
    <div className="mt-3 flex max-w-[68ch] flex-col gap-4 text-[1rem] leading-[1.75] text-ink-soft">
      {blocks.map((b, i) =>
        b.kind === 'p' ? (
          <p key={i}>{b.text}</p>
        ) : (
          <ul key={i} className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
