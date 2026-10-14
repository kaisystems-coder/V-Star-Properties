import type { QA } from '@/lib/aeo';

/**
 * Questions with direct answers, fully visible in the server HTML.
 *
 * Deliberately not an accordion: answer engines and screen readers both read
 * what is on the page, and a buyer scanning for "how much is rent here"
 * should not have to open anything to find it.
 */
export default function QuickAnswers({
  title = 'Quick answers',
  items,
  id = 'answers',
}: {
  title?: string;
  items: QA[];
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={id + '-title'} className="border-t border-mist-edge">
      <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-14">
        <h2 id={id + '-title'} className="font-display text-[1.7rem] tracking-display text-ink sm:text-[2rem]">
          {title}
        </h2>
        <dl className="mt-7 grid gap-x-12 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.q} className="border-t border-mist-edge py-5">
              <dt className="font-display text-[1.08rem] leading-snug tracking-display text-ink">
                {item.q}
              </dt>
              <dd className="mt-2 max-w-[62ch] text-[0.97rem] leading-[1.7] text-ink-mute">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
