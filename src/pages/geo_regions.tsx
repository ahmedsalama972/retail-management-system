import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { GeoRegionsView } from 'src/sections/geo-regions/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`المحافظات والأقسام والدوائر - ${CONFIG.appName}`}</title>
      </Helmet>
      <GeoRegionsView />
    </>
  );
}
