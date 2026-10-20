import { abs, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import AgentRoster from '@/components/AgentRoster';
import AgentFeature from '@/components/AgentFeature';
import { getAgents } from '@/lib/agents';
import { getListings } from '@/lib/listings';

const DESCRIPTION =
  'One agent, every listing. V-Star Properties handles sales, rentals and land across San Fernando and South and Central Trinidad personally.';

export const metadata: Metadata = {
  title: 'Our agent',
  description: DESCRIPTION,
  alternates: { canonical: abs('/our-agents') },
  openGraph: {
    title: 'Our agent · ' + SITE_NAME,
    description: DESCRIPTION,
    url: abs('/our-agents'),
    siteName: SITE_NAME,
    locale: 'en_TT',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function AgentsPage() {
  const agents = getAgents();
  const listings = await getListings();

  // A one-agent brokerage gets one profile card, not a roster with an area
  // filter that can only ever return the same person.
  if (agents.length === 1) {
    const agent = agents[0];

    return (
      <>
        <PageHeader
          eyebrow="Our agent"
          title="One agent, every listing"
          intro="Every property on this site is handled personally, from the first viewing to the keys. Open the profile to see them all in one place."
          meta={listings.length + ' properties on the books'}
        />

        <section className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
          <AgentFeature agent={agent} listings={listings} />
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Our agents"
        title="The people who hold the files"
        intro="Every listing on this site belongs to a named agent who has walked the property, measured it and priced it. Find the one who works your area."
        meta={agents.length + ' licensed agents across Trinidad & Tobago'}
      />

      <section className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
        <AgentRoster agents={agents} />
      </section>
    </>
  );
}
