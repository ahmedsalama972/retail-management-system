import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { varAlpha } from 'src/theme/styles';
import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';
import { useAuth } from 'src/contexts/auth-context';
import { getHomePathForUser } from 'src/utils/user-role';
import ProtectedRoute, { GuestRoute, LOGIN_PATH } from './protected-routes';

export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const RegisterPage = lazy(() => import('src/pages/register'));
export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const LegalIssuesPage = lazy(() => import('src/pages/legal_issues'));
export const PendingLegalIssuesPage = lazy(() => import('src/pages/pending_legal_issues'));
export const WarningsPage = lazy(() => import('src/pages/warnings'));
export const LegalCasesPage = lazy(() => import('src/pages/legal_cases'));
export const LegalCaseDetailsPage = lazy(() => import('src/pages/legal_case_details'));
export const SignDocumentPage = lazy(() => import('src/pages/sign_document'));
export const SettingsPage = lazy(() => import('src/pages/settings'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const EsignDashboardPage = lazy(() => import('src/pages/esign_dashboard'));
export const EsignLibraryPage = lazy(() => import('src/pages/esign_library'));
export const EsignContractsPage = lazy(() => import('src/pages/esign_contracts'));
export const EsignGeneratePage = lazy(() => import('src/pages/esign_generate'));
export const EsignSignPage = lazy(() => import('src/pages/esign_sign'));
export const EsignProfilePage = lazy(() => import('src/pages/esign_profile'));
export const ProfilePage = lazy(() => import('src/pages/profile'));
export const TeamPage = lazy(() => import('src/pages/team'));
export const UsersAdminPage = lazy(() => import('src/pages/users_admin'));
export const ClientsPage = lazy(() => import('src/pages/clients'));
export const ClientDetailsPage = lazy(() => import('src/pages/client_details'));
export const CivilCasesPage = lazy(() => import('src/pages/civil_cases'));
export const CivilCaseDetailsPage = lazy(() => import('src/pages/civil_case_details'));

const renderFallback = (
  <Box display="flex" alignItems="center" justifyContent="center" flex="1 1 auto">
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export function Router() {
  const { user, isAuthenticated } = useAuth();
  const homePath = getHomePathForUser(user);

  return useRoutes([
    {
      path: LOGIN_PATH,
      element: (
        <GuestRoute>
          <AuthLayout>
            <SignInPage />
          </AuthLayout>
        </GuestRoute>
      ),
      index: true,
    },
    {
      path: '/register',
      element: (
        <ProtectedRoute legalOnly>
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <Navigate to={homePath} replace />
        </ProtectedRoute>
      ),
    },
    {
      element: (
        <ProtectedRoute>
          <DashboardLayout>
            <Suspense fallback={renderFallback}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      ),
      children: [
        // Legal staff routes
        {
          path: 'legal-issues',
          element: (
            <ProtectedRoute legalOnly>
              <LegalIssuesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'legal-issues/:id/sign',
          element: (
            <ProtectedRoute legalOnly>
              <SignDocumentPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'legal-issues/:id',
          element: (
            <ProtectedRoute legalOnly>
              <LegalCaseDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'pending-legal-issues',
          element: (
            <ProtectedRoute legalOnly>
              <PendingLegalIssuesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'pending-legal-issues/:id/sign',
          element: (
            <ProtectedRoute legalOnly>
              <SignDocumentPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'pending-legal-issues/:id',
          element: (
            <ProtectedRoute legalOnly>
              <LegalCaseDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'warnings',
          element: (
            <ProtectedRoute legalOnly>
              <WarningsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'legal-cases',
          element: (
            <ProtectedRoute legalOnly>
              <LegalCasesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'legal-cases/:id/sign',
          element: (
            <ProtectedRoute legalOnly>
              <SignDocumentPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'legal-cases/:id',
          element: (
            <ProtectedRoute legalOnly>
              <LegalCaseDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'civil-cases',
          element: (
            <ProtectedRoute legalOnly>
              <CivilCasesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'civil-cases/:id',
          element: (
            <ProtectedRoute legalOnly>
              <CivilCaseDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'clients',
          element: (
            <ProtectedRoute legalOnly>
              <ClientsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'clients/:id',
          element: (
            <ProtectedRoute legalOnly>
              <ClientDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'geo-regions',
          element: <Navigate to="/settings?tab=geo" replace />,
        },
        {
          path: 'settings',
          element: (
            <ProtectedRoute legalOnly>
              <SettingsPage />
            </ProtectedRoute>
          ),
        },

        // E-sign / company routes
        {
          path: 'esign/dashboard',
          element: (
            <ProtectedRoute requireFeature={['view_library', 'upload_documents']}>
              <EsignDashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'esign/library',
          element: (
            <ProtectedRoute requireFeature="view_library">
              <EsignLibraryPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'esign/contracts',
          element: (
            <ProtectedRoute requireFeature={['view_inbox', 'sign_documents']}>
              <EsignContractsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'esign/generate',
          element: (
            <ProtectedRoute requireUpload>
              <EsignGeneratePage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'esign/sign/:id',
          element: (
            <ProtectedRoute requireFeature="sign_documents">
              <EsignSignPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'esign/profile',
          element: <Navigate to="/profile" replace />,
        },
        {
          path: 'profile',
          element: (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'team',
          element: (
            <ProtectedRoute requireFeature="manage_team">
              <TeamPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'users',
          element: (
            <ProtectedRoute requireFeature="manage_users">
              <UsersAdminPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: '404',
      element: isAuthenticated ? <Page404 /> : <Navigate to={LOGIN_PATH} replace />,
    },
    {
      path: '*',
      element: <Navigate to={isAuthenticated ? homePath : LOGIN_PATH} replace />,
    },
  ]);
}

