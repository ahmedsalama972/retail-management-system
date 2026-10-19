export const COMPANY_TYPE = 'شركة';
export const ADMIN_TYPE = 'مدير';

export type FeatureKey =
  | 'upload_documents'
  | 'view_library'
  | 'view_inbox'
  | 'share_documents'
  | 'sign_documents'
  | 'manage_team'
  | 'legal_module'
  | 'manage_users';

export type UserFeatures = Partial<Record<FeatureKey, boolean>>;

export type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
  type?: string | null;
  work_type?: string | null;
  company_name?: string | null;
  companyname?: string | null;
  parent_id?: number | null;
  features?: UserFeatures;
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  upload_documents: 'رفع / إنشاء المستندات',
  view_library: 'ملفات الشركة (المكتبة)',
  view_inbox: 'الملفات الواردة',
  share_documents: 'مشاركة المستندات للتوقيع',
  sign_documents: 'توقيع المستندات',
  manage_team: 'إدارة فريق العمل',
  legal_module: 'الوحدة القانونية',
  manage_users: 'إدارة المستخدمين والصلاحيات',
};

export function featureLabel(key: string) {
  return FEATURE_LABELS[key as FeatureKey] || key.replace(/_/g, ' ');
}

export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

export function getStoredUser(): StoredUser | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function isCompanyUser(user?: StoredUser | null) {
  const type = String(user?.type || '').trim().toLowerCase();
  return type === COMPANY_TYPE || type === 'company';
}

export function isAdminUser(user?: StoredUser | null) {
  const value = String(user?.type || '').trim();
  return value === ADMIN_TYPE || value.toLowerCase() === 'admin' || value.includes('مدير');
}

export function defaultFeaturesForType(type?: string | null): UserFeatures {
  if (isAdminUser({ type })) {
    return Object.fromEntries(FEATURE_KEYS.map((key) => [key, true])) as UserFeatures;
  }
  if (isCompanyUser({ type })) {
    return {
      upload_documents: true,
      view_library: true,
      view_inbox: true,
      share_documents: true,
      sign_documents: true,
      manage_team: true,
      legal_module: false,
      manage_users: false,
    };
  }
  return {
    upload_documents: false,
    view_library: false,
    view_inbox: true,
    share_documents: false,
    sign_documents: true,
    manage_team: false,
    legal_module: true,
    manage_users: false,
  };
}

export function normalizeFeatures(raw: unknown, type?: string | null): UserFeatures {
  const defaults = defaultFeaturesForType(type);
  const incoming = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const result: UserFeatures = { ...defaults };
  FEATURE_KEYS.forEach((key) => {
    if (typeof incoming[key] === 'boolean') {
      result[key] = incoming[key] as boolean;
    }
  });
  if (isAdminUser({ type })) {
    result.manage_users = true;
    result.upload_documents = true;
    result.manage_team = true;
  }
  if (isCompanyUser({ type })) {
    result.upload_documents = true;
    result.manage_team = true;
  }
  // Upload is reserved for company + admin account types
  if (!isAdminUser({ type }) && !isCompanyUser({ type })) {
    result.upload_documents = false;
  }
  return result;
}

export function hasFeature(user: StoredUser | null | undefined, feature: FeatureKey) {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const features = normalizeFeatures(user.features, user.type);
  return Boolean(features[feature]);
}

/** Only company and admin accounts can upload / create documents */
export function canUploadDocuments(user?: StoredUser | null) {
  if (!user) return false;
  return isAdminUser(user) || isCompanyUser(user);
}

export function canShareDocuments(user?: StoredUser | null) {
  if (!user) return false;
  if (isAdminUser(user) || isCompanyUser(user)) return true;
  return hasFeature(user, 'share_documents');
}

export function getHomePathForUser(user?: StoredUser | null) {
  if (isCompanyUser(user) || canUploadDocuments(user) || hasFeature(user, 'view_library')) {
    return '/esign/dashboard';
  }
  if (hasFeature(user, 'view_inbox') && !hasFeature(user, 'legal_module')) {
    return '/esign/contracts';
  }
  return '/dashboard';
}
