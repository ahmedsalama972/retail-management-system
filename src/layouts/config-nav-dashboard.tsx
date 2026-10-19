import {
  GavelOutlined,
  WarningAmberOutlined,
  PendingActionsOutlined,
  SettingsOutlined,
  BalanceOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  FolderSpecialOutlined,
  PersonOutlined,
  GroupsOutlined,
  ManageAccountsOutlined,
  PeopleAltOutlined,
  AccountBalanceOutlined,
} from '@mui/icons-material';

import {
  canUploadDocuments,
  hasFeature,
  isAdminUser,
  isCompanyUser,
  type StoredUser,
} from 'src/utils/user-role';

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export type NavGroup = {
  subheader: string;
  items: NavItem[];
};

export function getNavDataForUser(user?: StoredUser | null): NavGroup[] {
  const groups: NavGroup[] = [];

  const showEsignDash =
    isCompanyUser(user) || isAdminUser(user) || canUploadDocuments(user) || hasFeature(user, 'view_library');
  const showInbox =
    isCompanyUser(user) || isAdminUser(user) || hasFeature(user, 'view_inbox') || hasFeature(user, 'sign_documents');
  const showLibrary =
    isCompanyUser(user) || isAdminUser(user) || hasFeature(user, 'view_library') || canUploadDocuments(user);
  const showTeam = isCompanyUser(user) || isAdminUser(user) || hasFeature(user, 'manage_team');
  const showUsersAdmin = isAdminUser(user) || hasFeature(user, 'manage_users');
  const showLegal =
    isAdminUser(user) ||
    hasFeature(user, 'legal_module') ||
    (!isCompanyUser(user) && !hasFeature(user, 'view_inbox'));

  const esignItems: NavItem[] = [];
  if (showEsignDash) {
    esignItems.push({ title: 'لوحة التحكم', path: '/esign/dashboard', icon: <DashboardOutlined /> });
  }
  if (showInbox) {
    esignItems.push({ title: 'الملفات الواردة', path: '/esign/contracts', icon: <DescriptionOutlined /> });
  }
  if (showLibrary) {
    esignItems.push({ title: 'ملفات الشركة', path: '/esign/library', icon: <FolderSpecialOutlined /> });
  }
  if (esignItems.length) {
    groups.push({ subheader: 'التوقيع الإلكتروني', items: esignItems });
  }

  if (showLegal && !isCompanyUser(user)) {
    const legalItems: NavItem[] = [];
    // Avoid duplicate "لوحة التحكم" when e-sign dashboard is already in the nav
    if (!esignItems.length) {
      legalItems.push({ title: 'لوحة التحكم', path: '/dashboard', icon: <DashboardOutlined /> });
    }
    legalItems.push(
      { title: 'الجنح', path: '/legal-cases', icon: <GavelOutlined /> },
      { title: 'المدني', path: '/civil-cases', icon: <AccountBalanceOutlined /> },
      { title: 'العملاء', path: '/clients', icon: <PeopleAltOutlined /> },
      { title: 'قضايا قانونية معلقة', path: '/pending-legal-issues', icon: <PendingActionsOutlined /> },
      { title: 'إنذارات', path: '/warnings', icon: <WarningAmberOutlined /> },
      { title: 'المشكلة القانونية', path: '/legal-issues', icon: <BalanceOutlined /> },
      { title: 'إعدادات بيانات النظام', path: '/settings', icon: <SettingsOutlined /> }
    );
    groups.push({ subheader: 'القضايا القانونية', items: legalItems });
  }

  const manageItems: NavItem[] = [];
  // Admin: one merged users/team page. Company: team-only page.
  if (showUsersAdmin) {
    manageItems.push({ title: 'المستخدمون والصلاحيات', path: '/users', icon: <ManageAccountsOutlined /> });
  } else if (showTeam) {
    manageItems.push({ title: 'فريق العمل', path: '/team', icon: <GroupsOutlined /> });
  }
  if (manageItems.length) {
    groups.push({ subheader: 'الإدارة والفريق', items: manageItems });
  }

  groups.push({
    subheader: 'الحساب',
    items: [{ title: 'الملف الشخصي والبيانات', path: '/profile', icon: <PersonOutlined /> }],
  });

  return groups;
}

/** Flat list helper when a consumer still expects paths only */
export function flattenNavData(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items);
}

export const navData = getNavDataForUser(null);
