import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { EsignProfileView } from 'src/sections/esign/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`الملف الشخصي - ${CONFIG.appName}`}</title>
      </Helmet>
      <EsignProfileView />
    </>
  );
}
