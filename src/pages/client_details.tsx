import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { ClientDetailsView } from 'src/sections/clients/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`تفاصيل العميل - ${CONFIG.appName}`}</title>
      </Helmet>
      <ClientDetailsView />
    </>
  );
}
