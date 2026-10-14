import type { Agent } from '@/types/agent';

/**
 * The agency roster. V-Star is a one-agent brokerage, so the roster is one
 * profile: the principal, who holds every listing on the site.
 *
 * TODO(client): swap `name` for her own name and `image` for a headshot
 * when she sends them. Until then the profile carries the company name and
 * the logo, exactly as she presents herself on Facebook and My Bunch of Keys.
 */
export const AGENTS: Agent[] = [
  {
    id: 'ag-01',
    slug: 'v-star-properties',
    name: 'V-Star Properties',
    role: 'Principal Agent',
    territories: ['San Fernando', 'South Trinidad', 'Central Trinidad', 'North & East Trinidad'],
    specialties: [
      'Houses & townhouses',
      'Residential & executive rentals',
      'Residential, agricultural & investment land',
      'Commercial & warehouse space',
    ],
    bio: 'V-Star Properties Company Limited has more than ten years of experience meeting the demands of its clientele. Known for a broad network and excellent personal and communication skills, V-Star makes for smooth, stress-free transactions, with confidentiality, trustworthiness and individual attention whether you are buying, selling or renting.',
    phone: '+1 (868) 718-7839',
    email: 'v-starproperty@outlook.com',
    image: '/brand/v-star-logo.jpg',
    imageIsLogo: true,
    joined: 2015,
    experienceLabel: '10+ years',
    languages: ['English'],
    credential: 'FIU-registered real estate agency',
  },
];

export function getAgents(): Agent[] {
  // TODO: replace with Supabase query
  // const { data } = await supabase.from('agents').select('*').order('joined');
  return AGENTS;
}

export function getAgentBySlug(slug: string): Agent | undefined {
  // TODO: replace with Supabase query
  // const { data } = await supabase.from('agents').select('*').eq('slug', slug).single();
  return AGENTS.find((a) => a.slug === slug);
}

/** Every territory covered by at least one agent, in the roster's own order. */
export function allTerritories(agents: Agent[]): string[] {
  const order = ['San Fernando', 'South Trinidad', 'Central Trinidad', 'North & East Trinidad', 'Tobago'];
  const present = new Set(agents.flatMap((a) => a.territories));
  return order.filter((t) => present.has(t));
}
