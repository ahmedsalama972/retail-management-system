import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { CivilCaseDetailsView } from 'src/sections/civil-cases/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`تفاصيل الدعوى المدنية - ${CONFIG.appName}`}</title>
      </Helmet>
      <CivilCaseDetailsView />
    </>
  );
}
