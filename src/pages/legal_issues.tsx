import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { LegalCasesView } from 'src/sections/legal-cases/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`المشكلة القانونية - ${CONFIG.appName}`}</title>
      </Helmet>
      <LegalCasesView title="المشكلة القانونية" addLabel="إضافة مشكلة قانونية" />
    </>
  );
}
