import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { CivilCasesView } from 'src/sections/civil-cases/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`المدني - ${CONFIG.appName}`}</title>
      </Helmet>
      <CivilCasesView />
    </>
  );
}
