import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { TeamUsersView } from 'src/sections/team/view/team_users_view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`فريق العمل - ${CONFIG.appName}`}</title>
      </Helmet>
      <TeamUsersView mode="team" />
    </>
  );
}
