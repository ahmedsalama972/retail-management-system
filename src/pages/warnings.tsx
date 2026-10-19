import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { WarningsView } from 'src/sections/warnings/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`إنذارات - ${CONFIG.appName}`}</title>
      </Helmet>
      <WarningsView />
    </>
  );
}
