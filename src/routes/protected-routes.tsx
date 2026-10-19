import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from 'src/contexts/auth-context';
import { LOGIN_PATH } from 'src/utils/auth-session';
import {
  canUploadDocuments,
  getHomePathForUser,
  hasFeature,
  isAdminUser,
  isCompanyUser,
  type FeatureKey,
} from 'src/utils/user-role';

export { LOGIN_PATH };

interface ProtectedRouteProps {
  children: React.ReactNode;
  companyOnly?: boolean;
  legalOnly?: boolean;
  requireFeature?: FeatureKey | FeatureKey[];
  requireUpload?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  companyOnly,
  legalOnly,
  requireFeature,
  requireUpload,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const company = isCompanyUser(user);
  const admin = isAdminUser(user);

  if (companyOnly && !company && !admin && !canUploadDocuments(user) && !hasFeature(user, 'view_inbox')) {
    return <Navigate to={getHomePathForUser(user)} replace />;
  }

  if (legalOnly && company && !admin && !hasFeature(user, 'legal_module')) {
    return <Navigate to={getHomePathForUser(user)} replace />;
  }

  if (requireUpload && !canUploadDocuments(user)) {
    return <Navigate to={getHomePathForUser(user)} replace />;
  }

  if (requireFeature) {
    const keys = Array.isArray(requireFeature) ? requireFeature : [requireFeature];
    const allowed =
      admin ||
      keys.some(
        (key) => hasFeature(user, key) || (key === 'view_library' && canUploadDocuments(user))
      );
    if (!allowed) {
      return <Navigate to={getHomePathForUser(user)} replace />;
    }
  }

  return <>{children}</>;
};

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getHomePathForUser(user)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
