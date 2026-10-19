import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { LegalCaseDetailsView } from 'src/sections/legal-case-details/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`ملف القضية - ${CONFIG.appName}`}</title>
      </Helmet>
      <LegalCaseDetailsView />
    </>
  );
}
