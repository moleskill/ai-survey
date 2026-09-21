import SiteFrame from '@/components/SiteFrame';
import PlanView from '@/components/PlanView';
import { loadSite } from '@/lib/content';
import { buildPlan } from '@/lib/viewModels';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'План мероприятий' };

export default async function PlanPage() {
  const site = await loadSite();
  return (
    <SiteFrame>
      <PlanView plan={buildPlan(site.events, site.photos)} failed={site.failed} />
    </SiteFrame>
  );
}
