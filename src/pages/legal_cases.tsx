import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { LegalCasesView } from 'src/sections/legal-cases/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`الجنح - ${CONFIG.appName}`}</title>
      </Helmet>
      <LegalCasesView title="الجنح" addLabel="إضافة جنحة" />
    </>
  );
}
