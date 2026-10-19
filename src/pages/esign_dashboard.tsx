import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { EsignDashboardView } from 'src/sections/esign/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`لوحة التحكم - ${CONFIG.appName}`}</title>
      </Helmet>
      <EsignDashboardView />
    </>
  );
}
