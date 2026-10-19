import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { EsignSignView } from 'src/sections/esign/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`توقيع الملف - ${CONFIG.appName}`}</title>
      </Helmet>
      <EsignSignView />
    </>
  );
}
