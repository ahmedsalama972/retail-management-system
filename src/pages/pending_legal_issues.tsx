import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { LegalCasesView } from 'src/sections/legal-cases/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`قضايا قانونية معلقة - ${CONFIG.appName}`}</title>
      </Helmet>
      <LegalCasesView title="قضايا قانونية معلقة" defaultFilters={{ pending: true, is_closed: false }} />
    </>
  );
}
