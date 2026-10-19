import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { EsignDocumentsView } from 'src/sections/esign/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`ملفات الشركة - ${CONFIG.appName}`}</title>
      </Helmet>
      <EsignDocumentsView variant="library" />
    </>
  );
}
