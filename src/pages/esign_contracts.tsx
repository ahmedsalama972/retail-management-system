import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { EsignDocumentsView } from 'src/sections/esign/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`الملفات الواردة - ${CONFIG.appName}`}</title>
      </Helmet>
      <EsignDocumentsView variant="inbox" />
    </>
  );
}
