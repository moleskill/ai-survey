import SiteFrame from '@/components/SiteFrame';
import GalleryView from '@/components/GalleryView';
import { loadSite } from '@/lib/content';
import { buildAlbums } from '@/lib/viewModels';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Фотогалерея' };

export default async function GalleryPage() {
  const site = await loadSite();
  return (
    <SiteFrame>
      <GalleryView albums={buildAlbums(site.events, site.photos)} failed={site.failed} />
    </SiteFrame>
  );
}
