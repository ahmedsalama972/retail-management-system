import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { SignDocumentView } from 'src/sections/legal-cases/view/sign_document_view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`توقيع الملف - ${CONFIG.appName}`}</title>
      </Helmet>
      <SignDocumentView />
    </>
  );
}
