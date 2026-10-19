import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { ProfileView } from 'src/sections/profile/view/profile_view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`الملف الشخصي والبيانات - ${CONFIG.appName}`}</title>
      </Helmet>
      <ProfileView />
    </>
  );
}
