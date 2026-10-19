import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { ClientsView } from 'src/sections/clients/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`العملاء - ${CONFIG.appName}`}</title>
      </Helmet>
      <ClientsView />
    </>
  );
}
