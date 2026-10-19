import axios, { type AxiosResponse } from 'axios';
import { setCsrfTokenHeader } from 'src/utils/csrf';
import { resolveApiBaseUrl } from 'src/utils/api-base';
import {
  clearAuthSession,
  getAuthToken,
  isAuthPublicUrl,
  LOGIN_PATH,
} from 'src/utils/auth-session';

axios.defaults.withCredentials = true;

setCsrfTokenHeader();

let redirectingToLogin = false;

function forceLoginRedirect() {
  if (redirectingToLogin) return;
  if (window.location.pathname === LOGIN_PATH) {
    clearAuthSession();
    return;
  }
  redirectingToLogin = true;
  clearAuthSession();
  window.location.replace(LOGIN_PATH);
}

axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Browser must set multipart boundary — never force JSON Content-Type on FormData
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
    } else if (config.headers) {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
  }
  setCsrfTokenHeader();
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    if ((status === 401 || status === 403) && !isAuthPublicUrl(url)) {
      // 403 from feature gates should not always kick out — only unauthenticated 401
      if (status === 401) {
        forceLoginRedirect();
      }
    }
    return Promise.reject(error);
  }
);

const baseURL = () => resolveApiBaseUrl();

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const formDataHeaders = {
  Accept: 'application/json',
};

const withCredentials = { withCredentials: true };

const jsonConfig = {
  headers: jsonHeaders,
  withCredentials: true as const,
};

const formConfig = {
  headers: formDataHeaders,
  withCredentials: true as const,
};

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function normalizeQueryValue(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if ('name' in value && (value as { name?: unknown }).name != null) {
      return (value as { name: unknown }).name;
    }
  }
  return value;
}

function buildQueryParams(params: Record<string, unknown> = {}) {
  const query: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, raw]) => {
    const value = normalizeQueryValue(raw);
    if (value !== undefined) {
      query[key] = value;
    }
  });
  return query;
}

function listQueryParams({
  pageParam,
  page,
  search,
  filters,
  perPage,
}: {
  pageParam?: number;
  page?: number;
  search?: string;
  filters?: Record<string, unknown>;
  perPage?: number;
}) {
  return buildQueryParams({
    page: pageParam ?? page,
    search,
    per_page: perPage,
    ...(filters || {}),
  });
}

function esignSignedParam(signed: unknown) {
  if (signed === 0 || signed === 1 || signed === '0' || signed === '1') {
    return { signed };
  }
  return {};
}

// ——— Auth ———

export const Register_API = (axiosdata: unknown) =>
  axios.post(`${baseURL()}/register`, axiosdata, jsonConfig);

export const Login_API = (axiosdata: unknown) =>
  axios.post(`${baseURL()}/login`, axiosdata, jsonConfig);

export const Logout_API = (axiosdata?: unknown) =>
  axios.post(`${baseURL()}/logout`, axiosdata ?? {}, jsonConfig);

// ——— Legal cases ———

export const GetLegalCases_API = ({
  pageParam,
  search,
  filters,
}: {
  pageParam?: number;
  search?: string;
  filters?: Record<string, unknown>;
}) =>
  axios.get(`${baseURL()}/legal-cases`, {
    ...withCredentials,
    params: listQueryParams({ pageParam, search, filters }),
  });

export const GetAllLegalCases_API = (filters?: Record<string, unknown>) =>
  axios.get(`${baseURL()}/all-legal-cases`, {
    ...withCredentials,
    params: buildQueryParams(filters || {}),
  });

export const GetLegalCaseCompanies_API = (params: Record<string, unknown> = {}) =>
  axios.get(`${baseURL()}/legal-cases/companies`, {
    ...withCredentials,
    params: buildQueryParams(params),
  });

export const GetLegalCase_API = ({ id }: { id: number | string }) =>
  axios.get(`${baseURL()}/legal-cases/${id}`, withCredentials);

export const GetLegalCaseFile_API = ({
  id,
  type = 'gon7a',
}: {
  id: number | string;
  type?: string;
}) =>
  axios.get(`${baseURL()}/legal-cases/${id}/file`, {
    ...withCredentials,
    params: { type },
    responseType: 'blob',
  });

export const AddLegalCase_API = (axiosdata: FormData) =>
  axios.post(`${baseURL()}/legal-cases`, axiosdata, formConfig);

export const EditLegalCase_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/legal-cases/${id}`, axiosdata, formConfig);

export const DeleteLegalCase_API = ({ id }: { id: number | string }) =>
  axios.delete(`${baseURL()}/legal-cases/${id}`, withCredentials);

export const SaveSignedLegalCaseFile_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/legal-cases/${id}/signed`, axiosdata, formConfig);

export const AddCaseHearing_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/legal-cases/${id}/hearings`, axiosdata, jsonConfig);

export const AddCaseVerdict_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/legal-cases/${id}/verdicts`, axiosdata, formConfig);

export const AddCaseOpposition_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/legal-cases/${id}/oppositions`, axiosdata, formConfig);

export const AddCaseAppeal_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/legal-cases/${id}/appeals`, axiosdata, formConfig);

export const AddCaseFollowup_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/legal-cases/${id}/followups`, axiosdata, jsonConfig);

export const AddCaseAttachment_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/legal-cases/${id}/attachments`, axiosdata, formConfig);

// ——— Civil cases ———

export const GetCivilCases_API = ({
  pageParam,
  search,
  filters,
}: {
  pageParam?: number;
  search?: string;
  filters?: Record<string, unknown>;
}) =>
  axios.get(`${baseURL()}/civil-cases`, {
    ...withCredentials,
    params: listQueryParams({ pageParam, search, filters }),
  });

export const GetAllCivilCases_API = ({
  search,
  ...filters
}: {
  search?: string;
  [key: string]: unknown;
} = {}) =>
  axios.get(`${baseURL()}/all-civil-cases`, {
    ...withCredentials,
    params: buildQueryParams({ search, ...filters }),
  });

export const GetCivilCase_API = ({ id }: { id: number | string }) =>
  axios.get(`${baseURL()}/civil-cases/${id}`, withCredentials);

export const AddCivilCase_API = (
  axiosdata: FormData | Record<string, unknown>
): Promise<AxiosResponse> => {
  if (isFormData(axiosdata)) {
    return axios.post(`${baseURL()}/civil-cases`, axiosdata, formConfig);
  }
  return axios.post(`${baseURL()}/civil-cases`, axiosdata, jsonConfig);
};

export const EditCivilCase_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData | Record<string, unknown>;
}): Promise<AxiosResponse> => {
  if (isFormData(axiosdata)) {
    return axios.post(`${baseURL()}/civil-cases/${id}`, axiosdata, formConfig);
  }
  return axios.post(`${baseURL()}/civil-cases/${id}`, axiosdata, jsonConfig);
};

export const DeleteCivilCase_API = ({ id }: { id: number | string }) =>
  axios.delete(`${baseURL()}/civil-cases/${id}`, withCredentials);

export const AddCivilHearing_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/civil-cases/${id}/hearings`, axiosdata, jsonConfig);

export const UpsertCivilAppeal_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/civil-cases/${id}/appeal`, axiosdata, jsonConfig);

// ——— Warnings ———

export const GetWarnings_API = ({
  pageParam,
  search,
  filters,
}: {
  pageParam?: number;
  search?: string;
  filters?: Record<string, unknown>;
}) =>
  axios.get(`${baseURL()}/warnings`, {
    ...withCredentials,
    params: listQueryParams({ pageParam, search, filters }),
  });

export const GetAllWarnings_API = (filters?: Record<string, unknown>) =>
  axios.get(`${baseURL()}/all-warnings`, {
    ...withCredentials,
    params: buildQueryParams(filters || {}),
  });

export const GetWarningCompanies_API = (params: Record<string, unknown> = {}) =>
  axios.get(`${baseURL()}/warnings/companies`, {
    ...withCredentials,
    params: buildQueryParams(params),
  });

export const AddWarning_API = (axiosdata: FormData) =>
  axios.post(`${baseURL()}/warnings`, axiosdata, formConfig);

export const EditWarning_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: FormData;
}) => axios.post(`${baseURL()}/warnings/${id}`, axiosdata, formConfig);

// ——— Lookups ———

export const GetLookups_API = ({
  type,
  parentId,
}: {
  type?: string;
  parentId?: number | string | null;
} = {}) =>
  axios.get(`${baseURL()}/lookups`, {
    ...withCredentials,
    params: buildQueryParams({
      type,
      parent_id: parentId,
    }),
  });

export const AddLookup_API = (axiosdata: unknown) =>
  axios.post(`${baseURL()}/lookups`, axiosdata, jsonConfig);

export const EditLookup_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/lookups/${id}`, axiosdata, jsonConfig);

export const DeleteLookup_API = ({ id }: { id: number | string }) =>
  axios.delete(`${baseURL()}/lookups/${id}`, withCredentials);

// ——— Clients & contracts ———

export const GetClients_API = ({
  pageParam,
  search,
  filters,
  perPage,
}: {
  pageParam?: number;
  search?: string;
  filters?: Record<string, unknown>;
  perPage?: number;
}) =>
  axios.get(`${baseURL()}/clients`, {
    ...withCredentials,
    params: listQueryParams({ pageParam, search, filters, perPage }),
  });

export const GetClient_API = ({ id }: { id: number | string }) =>
  axios.get(`${baseURL()}/clients/${id}`, withCredentials);

export const AddClient_API = (axiosdata: unknown) =>
  axios.post(`${baseURL()}/clients`, axiosdata, jsonConfig);

export const DeleteClient_API = ({ id }: { id: number | string }) =>
  axios.delete(`${baseURL()}/clients/${id}`, withCredentials);

export const GetCompanyAccounts_API = () =>
  axios.get(`${baseURL()}/company-accounts`, withCredentials);

export const GetContracts_API = ({
  pageParam,
  search,
}: {
  pageParam?: number;
  search?: string;
}) =>
  axios.get(`${baseURL()}/contracts`, {
    ...withCredentials,
    params: listQueryParams({ pageParam, search }),
  });

// ——— E-sign ———

export const GetEsignLibrary_API = ({
  page,
  search,
}: {
  page?: number;
  search?: string;
}) =>
  axios.get(`${baseURL()}/esign/library`, {
    ...withCredentials,
    params: buildQueryParams({ page, search }),
  });

export const GetEsignLibraryCounts_API = () =>
  axios.get(`${baseURL()}/esign/library/counts`, withCredentials);

export const UploadEsignLibrary_API = (formData: FormData) =>
  axios.post(`${baseURL()}/esign/library`, formData, formConfig);

export const DeleteEsignLibrary_API = ({ id }: { id: number | string }) =>
  axios.post(`${baseURL()}/esign/library/${id}/delete`, {}, jsonConfig);

export const ShareEsignDocument_API = (axiosdata: unknown) =>
  axios.post(`${baseURL()}/esign/share`, axiosdata, jsonConfig);

export const GetEsignShares_API = ({
  page,
  search,
  signed,
}: {
  page?: number;
  search?: string;
  signed?: number | string;
}) =>
  axios.get(`${baseURL()}/esign/shares`, {
    ...withCredentials,
    params: buildQueryParams({ page, search, ...esignSignedParam(signed) }),
  });

export const GetEsignInbox_API = ({
  page,
  search,
  signed,
}: {
  page?: number;
  search?: string;
  signed?: number | string;
}) =>
  axios.get(`${baseURL()}/esign/inbox`, {
    ...withCredentials,
    params: buildQueryParams({ page, search, ...esignSignedParam(signed) }),
  });

export const GetEsignInboxCounts_API = () =>
  axios.get(`${baseURL()}/esign/inbox/counts`, withCredentials);

export const GetEsignDashboard_API = () =>
  axios.get(`${baseURL()}/esign/dashboard-statistics`, withCredentials);

export const GetEsignDocument_API = ({
  kind,
  id,
}: {
  kind: string;
  id: number | string;
}) => axios.get(`${baseURL()}/esign/documents/${kind}/${id}`, withCredentials);

export const SignEsignShare_API = ({
  id,
  formData,
}: {
  id: number | string;
  formData: FormData;
}) => axios.post(`${baseURL()}/esign/sign/${id}`, formData, formConfig);

export const ForwardEsignShare_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/esign/shares/${id}/forward`, axiosdata, jsonConfig);

export const ReturnEsignShare_API = ({ id }: { id: number | string }) =>
  axios.post(`${baseURL()}/esign/shares/${id}/return`, {}, jsonConfig);

export const ConfirmEsignShare_API = ({ id }: { id: number | string }) =>
  axios.post(`${baseURL()}/esign/shares/${id}/confirm`, {}, jsonConfig);

export const GetSigningAssets_API = () =>
  axios.get(`${baseURL()}/esign/signing-assets`, withCredentials);

export const SaveSigningSignature_API = (axiosdata: unknown) =>
  axios.post(
    `${baseURL()}/esign/signing-assets/signature`,
    axiosdata,
    isFormData(axiosdata) ? formConfig : jsonConfig
  );

export const SaveSigningSeal_API = (axiosdata: unknown) =>
  axios.post(
    `${baseURL()}/esign/signing-assets/seal`,
    axiosdata,
    isFormData(axiosdata) ? formConfig : jsonConfig
  );

// ——— Users & dashboard ———

export const GetTeamUsers_API = ({
  page,
  search,
  teamOnly,
}: {
  page?: number;
  search?: string;
  teamOnly?: boolean;
}) =>
  axios.get(`${baseURL()}/users`, {
    ...withCredentials,
    params: buildQueryParams({
      page,
      search,
      ...(teamOnly ? { team: '1' } : {}),
    }),
  });

export const GetFeaturesCatalog_API = () =>
  axios.get(`${baseURL()}/features-catalog`, withCredentials);

export const GetShareRecipients_API = ({
  search,
  scope,
}: {
  search?: string;
  scope?: string;
}) =>
  axios.get(`${baseURL()}/share-recipients`, {
    ...withCredentials,
    params: buildQueryParams({ search, scope }),
  });

export const CreateTeamUser_API = (axiosdata: unknown) =>
  axios.post(`${baseURL()}/team-users`, axiosdata, jsonConfig);

export const UpdateTeamUser_API = ({
  id,
  axiosdata,
}: {
  id: number | string;
  axiosdata: unknown;
}) => axios.post(`${baseURL()}/users/${id}`, axiosdata, jsonConfig);

export const DeleteTeamUser_API = ({ id }: { id: number | string }) =>
  axios.delete(`${baseURL()}/users/${id}`, withCredentials);

export const GetSystemDashboard_API = () =>
  axios.get(`${baseURL()}/dashboard-statistics`, withCredentials);

// ---- Notifications ----
export const GetNotifications_API = ({
  page,
  perPage,
  unread,
}: {
  page?: number;
  perPage?: number;
  unread?: boolean;
} = {}) =>
  axios.get(`${baseURL()}/notifications`, {
    ...withCredentials,
    params: buildQueryParams({
      page,
      per_page: perPage,
      ...(unread ? { unread: '1' } : {}),
    }),
  });

export const GetNotificationsUnreadCount_API = () =>
  axios.get(`${baseURL()}/notifications/unread-count`, withCredentials);

export const MarkNotificationRead_API = ({ id }: { id: number | string }) =>
  axios.post(`${baseURL()}/notifications/${id}/read`, {}, jsonConfig);

export const MarkAllNotificationsRead_API = () =>
  axios.post(`${baseURL()}/notifications/read-all`, {}, jsonConfig);
