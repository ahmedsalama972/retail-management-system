import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { EsignGenerateView } from 'src/sections/esign/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`إنشاء ملف - ${CONFIG.appName}`}</title>
      </Helmet>
      <EsignGenerateView />
    </>
  );
}
