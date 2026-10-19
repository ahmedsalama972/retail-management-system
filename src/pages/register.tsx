import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { RegisterView } from 'src/sections/register/register-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`تسجيل - ${CONFIG.appName}`}</title>
      </Helmet>

      <RegisterView />
    </>
  );
}
