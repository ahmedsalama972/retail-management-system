import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardView } from 'src/sections/dashboard';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <Helmet>
                <title> {`لوحة التحكم - ${CONFIG.appName}`}</title>
            </Helmet>

            <DashboardView />
        </>
    );
}
