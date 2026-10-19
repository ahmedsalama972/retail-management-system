import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { isSocketEnabled } from 'src/utils/api-base';
import {
  clearStoredSigningAssets,
  syncStoredSigningAssets,
} from 'src/sections/pdf-sign/utils/signing-assets';
import {
  AddCaseAppeal_API,
  AddCaseAttachment_API,
  AddCaseFollowup_API,
  AddCaseHearing_API,
  AddCaseOpposition_API,
  AddCaseVerdict_API,
  AddCivilCase_API,
  AddCivilHearing_API,
  AddLegalCase_API,
  AddLookup_API,
  AddWarning_API,
  DeleteCivilCase_API,
  DeleteLookup_API,
  EditCivilCase_API,
  EditLegalCase_API,
  GetAllCivilCases_API,
  GetCivilCase_API,
  GetCivilCases_API,
  UpsertCivilAppeal_API,
  EditLookup_API,
  EditWarning_API,
  GetAllLegalCases_API,
  GetAllWarnings_API,
  AddClient_API,
  DeleteClient_API,
  GetClient_API,
  GetClients_API,
  GetCompanyAccounts_API,
  GetContracts_API,
  GetLegalCase_API,
  GetLegalCaseCompanies_API,
  GetLegalCases_API,
  GetLookups_API,
  GetWarningCompanies_API,
  GetWarnings_API,
  ConfirmEsignShare_API,
  CreateTeamUser_API,
  DeleteEsignLibrary_API,
  DeleteLegalCase_API,
  DeleteTeamUser_API,
  ForwardEsignShare_API,
  GetEsignDashboard_API,
  GetSystemDashboard_API,
  GetEsignDocument_API,
  GetEsignInboxCounts_API,
  GetEsignInbox_API,
  GetEsignLibraryCounts_API,
  GetEsignLibrary_API,
  GetEsignShares_API,
  GetFeaturesCatalog_API,
  GetShareRecipients_API,
  GetSigningAssets_API,
  GetTeamUsers_API,
  GetNotifications_API,
  GetNotificationsUnreadCount_API,
  Login_API,
  Logout_API,
  MarkAllNotificationsRead_API,
  MarkNotificationRead_API,
  Register_API,
  ReturnEsignShare_API,
  SaveSignedLegalCaseFile_API,
  SaveSigningSeal_API,
  SaveSigningSignature_API,
  ShareEsignDocument_API,
  SignEsignShare_API,
  UpdateTeamUser_API,
  UploadEsignLibrary_API,
} from 'src/apis/api';
import { useRouter } from 'src/routes/hooks';
import { caseSignPath, getListBasePath } from 'src/routes/case-paths';
import { useAuth } from 'src/contexts/auth-context';
import { clearAuthSession } from 'src/utils/auth-session';
import { getStoredUser } from 'src/utils/user-role';

const toastApiError = (error: any) => {
  const errors = error?.response?.data?.errors;
  if (errors) {
    Object.keys(errors).forEach((field) => {
      toast.error(`${field}: ${errors[field].join(', ')}`);
    });
  } else {
    toast.error(error?.response?.data?.message || 'حدث خطأ غير معروف.');
  }
};

export const useRegisterMutation = ({ setIsLoading, setOpen, onSuccess, redirectOnSuccess = true }: any) => {
  const router = useRouter();

  return useMutation(
    (axiosdata: any) => {
      setIsLoading(true);
      return Register_API(axiosdata);
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        setOpen?.(false);
        onSuccess?.();
        toast.success('تم التسجيل بنجاح');
        if (redirectOnSuccess) {
          router.push('/');
        }
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );
};

export const useLoginMutation = ({ setOpen, setIsLoading }: any) => {
  const queryClient = useQueryClient();
  const { loginSuccess } = useAuth();

  return useMutation(
    (axiosdata: any) => {
      setIsLoading(true);
      return Login_API(axiosdata);
    },
    {
      onSuccess: (data) => {
        clearStoredSigningAssets();
        queryClient.clear();

        const user = data?.data?.user;
        const token = data?.data?.accessToken || data?.data?.token;
        setIsLoading(false);
        setOpen?.(false);

        if (user && token) {
          loginSuccess(user, token);
          toast.success('تم تسجيل الدخول بنجاح');
          return;
        }

        clearAuthSession();
        toast.error('تعذر إتمام تسجيل الدخول');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );
};

export const useLogoutMutation = ({ setOpen, setIsLoading }: any) => {
  const queryClient = useQueryClient();
  const { logoutLocal } = useAuth();

  return useMutation(
    (axiosdata: any) => {
      setIsLoading(true);
      return Logout_API(axiosdata);
    },
    {
      onSuccess: () => {
        clearStoredSigningAssets();
        queryClient.clear();
        setIsLoading(false);
        setOpen?.(false);
        logoutLocal();
        toast.success('تم تسجيل الخروج بنجاح');
      },
      onError: () => {
        // Even if the API fails (expired token), clear local session and go to login.
        clearStoredSigningAssets();
        queryClient.clear();
        setIsLoading(false);
        setOpen?.(false);
        logoutLocal();
      },
    }
  );
};

export const useGetLegalCases = ({ key, search, page, filters, setIsLoading }: any) =>
  useQuery([key, page, search, filters], () => GetLegalCases_API({ pageParam: page, search, filters }), {
    onError: () => setIsLoading?.(false),
  });

export const useGetLegalCaseCompanies = ({ key, filters, search }: any) =>
  useQuery(
    [key, filters, search],
    () => GetLegalCaseCompanies_API({ ...filters, search }),
    { keepPreviousData: true }
  );

export const useGetAllLegalCases = ({ key, filters, setIsLoading }: any) =>
  useQuery([key, filters], () => GetAllLegalCases_API(filters), {
    enabled: false,
    onError: () => setIsLoading?.(false),
  });

export const useGetLegalCase = ({ key, id, setIsLoading }: any) =>
  useQuery([key, id], () => GetLegalCase_API({ id }), {
    enabled: Boolean(id),
    onError: () => setIsLoading?.(false),
  });

export const useAddLegalCaseMutation = ({ setOpen, setIsLoading, refetch }: any) => {
  const router = useRouter();

  return useMutation(
    (axiosdata: any) => {
      setIsLoading(true);
      return AddLegalCase_API(axiosdata);
    },
    {
      onSuccess: (response) => {
        setIsLoading(false);
        setOpen?.(false);
        refetch?.();
        toast.success('تم بنجاح');
        const created = response?.data?.data;
        if (created?.id && created?.gon7a_file_path) {
          const returnTo = getListBasePath();
          router.push(caseSignPath(created.id), { state: { returnTo } });
        }
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );
};

export const useSaveSignedLegalCaseFileMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading?.(true);
      return SaveSignedLegalCaseFile_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم حفظ الملف الموقع');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useDeleteLegalCaseMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id }: { id: number | string }) => {
      setIsLoading?.(true);
      return DeleteLegalCase_API({ id });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم حذف الجنحة');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useGetCivilCases = ({ key, search, page, filters, setIsLoading }: any) =>
  useQuery([key, page, search, filters], () => GetCivilCases_API({ pageParam: page, search, filters }), {
    onSettled: () => setIsLoading?.(false),
  });

export const useGetAllCivilCases = ({ key, search, filters, setIsLoading }: any) =>
  useQuery([key, search, filters], () => GetAllCivilCases_API({ search, ...(filters || {}) }), {
    enabled: false,
    onError: () => setIsLoading?.(false),
  });

export const useGetCivilCase = ({ key, id, setIsLoading }: any) =>
  useQuery([key, id], () => GetCivilCase_API({ id }), {
    enabled: Boolean(id),
    onSettled: () => setIsLoading?.(false),
  });

export const useAddCivilCaseMutation = ({ setOpen, setIsLoading, refetch }: any) =>
  useMutation(
    (axiosdata: any) => {
      setIsLoading?.(true);
      return AddCivilCase_API(axiosdata);
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        setOpen?.(false);
        refetch?.();
        toast.success('تم إضافة الدعوى المدنية');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useEditCivilCaseMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading?.(true);
      return EditCivilCase_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم الحفظ');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useDeleteCivilCaseMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id }: { id: number | string }) => {
      setIsLoading?.(true);
      return DeleteCivilCase_API({ id });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم حذف الدعوى');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useAddCivilHearingMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading?.(true);
      return AddCivilHearing_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم إضافة الجلسة');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useUpsertCivilAppealMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading?.(true);
      return UpsertCivilAppeal_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم حفظ الاستئناف');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useEditLegalCaseMutation = ({ setOpen, setIsLoading, refetch }: any) =>
  useMutation(
    ({ axiosdata, id }: { axiosdata: FormData; id: any }) => {
      setIsLoading(true);
      return EditLegalCase_API({ axiosdata, id });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        setOpen?.(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useAddCaseHearingMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading(true);
      return AddCaseHearing_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useAddCaseVerdictMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading(true);
      return AddCaseVerdict_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useAddCaseOppositionMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading(true);
      return AddCaseOpposition_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useAddCaseAppealMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading(true);
      return AddCaseAppeal_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useAddCaseFollowupMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading(true);
      return AddCaseFollowup_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useAddCaseAttachmentMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading(true);
      return AddCaseAttachment_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useGetWarnings = ({ key, search, page, filters, setIsLoading }: any) =>
  useQuery([key, page, search, filters], () => GetWarnings_API({ pageParam: page, search, filters }), {
    onError: () => setIsLoading?.(false),
  });

export const useGetWarningCompanies = ({ key, filters, search }: any) =>
  useQuery(
    [key, filters, search],
    () => GetWarningCompanies_API({ ...filters, search }),
    { keepPreviousData: true }
  );

export const useGetAllWarnings = ({ key, filters, setIsLoading }: any) =>
  useQuery([key, filters], () => GetAllWarnings_API(filters), {
    enabled: false,
    onError: () => setIsLoading?.(false),
  });

export const useAddWarningMutation = ({ setOpen, setIsLoading, refetch }: any) =>
  useMutation(
    (axiosdata: any) => {
      setIsLoading(true);
      return AddWarning_API(axiosdata);
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        setOpen?.(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useEditWarningMutation = ({ setOpen, setIsLoading, refetch }: any) =>
  useMutation(
    ({ axiosdata, id }: any) => {
      setIsLoading(true);
      return EditWarning_API({ axiosdata, id });
    },
    {
      onSuccess: () => {
        setIsLoading(false);
        setOpen?.(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading(false);
        toastApiError(error);
      },
    }
  );

export const useGetLookups = ({ key, type, parentId }: any) =>
  useQuery([key, type, parentId], () => GetLookups_API({ type, parentId }));

export const useAddLookupMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    (axiosdata: any) => {
      setIsLoading?.(true);
      return AddLookup_API(axiosdata);
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم بنجاح');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useEditLookupMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id, axiosdata }: any) => {
      setIsLoading?.(true);
      return EditLookup_API({ id, axiosdata });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم التعديل بنجاح');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useDeleteLookupMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id }: any) => {
      setIsLoading?.(true);
      return DeleteLookup_API({ id });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم الحذف');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useGetClients = ({ key, search, page, filters, perPage, setIsLoading }: any) =>
  useQuery(
    [key, page, search, filters, perPage],
    () => GetClients_API({ pageParam: page, search, filters, perPage }),
    {
      onSettled: () => setIsLoading?.(false),
    }
  );

export const useGetClient = ({ key, id, setIsLoading }: any) =>
  useQuery([key, id], () => GetClient_API({ id }), {
    enabled: Boolean(id),
    onSettled: () => setIsLoading?.(false),
  });

export const useAddClientMutation = ({ setIsLoading, refetch, onSuccess }: any) =>
  useMutation(
    (axiosdata: any) => {
      setIsLoading?.(true);
      return AddClient_API(axiosdata);
    },
    {
      onSuccess: (response) => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم إضافة العميل');
        onSuccess?.(response?.data?.data);
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useDeleteClientMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(
    ({ id }: { id: number | string }) => {
      setIsLoading?.(true);
      return DeleteClient_API({ id });
    },
    {
      onSuccess: () => {
        setIsLoading?.(false);
        refetch?.();
        toast.success('تم حذف العميل');
      },
      onError: (error: any) => {
        setIsLoading?.(false);
        toastApiError(error);
      },
    }
  );

export const useGetCompanyAccounts = ({ key }: any) =>
  useQuery([key], () => GetCompanyAccounts_API());

export const useGetContracts = ({ key, search, page }: any) =>
  useQuery([key, page, search], () => GetContracts_API({ pageParam: page, search }));

export const useGetEsignLibrary = ({ key, page, search, setIsLoading, enabled = true }: any) =>
  useQuery([key, page, search], () => GetEsignLibrary_API({ page, search }), {
    enabled,
    onSettled: () => setIsLoading?.(false),
  });

export const useGetEsignLibraryCounts = ({ key, enabled = true }: any) =>
  useQuery([key], () => GetEsignLibraryCounts_API(), { enabled });

export const useGetEsignShares = ({ key, page, search, signed, setIsLoading, enabled = true }: any) =>
  useQuery([key, page, search, signed], () => GetEsignShares_API({ page, search, signed }), {
    enabled,
    onSettled: () => setIsLoading?.(false),
  });

export const useGetEsignInbox = ({ key, page, search, signed, setIsLoading, enabled = true }: any) =>
  useQuery([key, page, search, signed], () => GetEsignInbox_API({ page, search, signed }), {
    enabled,
    onSettled: () => setIsLoading?.(false),
  });

export const useGetEsignInboxCounts = ({ key, enabled = true }: any) =>
  useQuery([key], () => GetEsignInboxCounts_API(), { enabled });

export const useGetEsignDashboard = ({ key }: any) =>
  useQuery([key], () => GetEsignDashboard_API());

export const useGetSystemDashboard = ({ key, enabled = true }: any) =>
  useQuery([key], () => GetSystemDashboard_API(), {
    enabled,
  });

export const useGetEsignDocument = ({ key, kind, id, setIsLoading }: any) =>
  useQuery([key, kind, id], () => GetEsignDocument_API({ kind, id }), {
    enabled: Boolean(id && kind),
    onSettled: () => setIsLoading?.(false),
  });

export const useGetSigningAssets = ({ key }: any) => {
  const userId = getStoredUser()?.id ?? null;
  return useQuery([key, userId], () => GetSigningAssets_API(), {
    enabled: Boolean(userId),
    onSuccess: (response) => {
      syncStoredSigningAssets(response?.data?.assets);
    },
  });
};

export const useUploadEsignLibraryMutation = ({ setIsLoading, refetch, onSuccess }: any) =>
  useMutation((formData: FormData) => {
    setIsLoading?.(true);
    return UploadEsignLibrary_API(formData);
  }, {
    onSuccess: (data) => {
      setIsLoading?.(false);
      refetch?.();
      onSuccess?.(data);
      toast.success('تم حفظ المستند');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useDeleteEsignLibraryMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(({ id }: any) => {
    setIsLoading?.(true);
    return DeleteEsignLibrary_API({ id });
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      refetch?.();
      toast.success('تم الحذف');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useShareEsignDocumentMutation = ({ setIsLoading, refetch, setOpen }: any) =>
  useMutation((axiosdata: any) => {
    setIsLoading?.(true);
    return ShareEsignDocument_API(axiosdata);
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      setOpen?.(false);
      refetch?.();
      toast.success('تم إرسال المستند للتوقيع');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useForwardEsignShareMutation = ({ setIsLoading, refetch, setOpen }: any) =>
  useMutation(({ id, axiosdata }: any) => {
    setIsLoading?.(true);
    return ForwardEsignShare_API({ id, axiosdata });
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      setOpen?.(false);
      refetch?.();
      toast.success('تم إرسال المستند لفريق الشركة');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useReturnEsignShareMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(({ id }: any) => {
    setIsLoading?.(true);
    return ReturnEsignShare_API({ id });
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      refetch?.();
      toast.success('تم إرجاع المستند الموقع للشركة الأصلية');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useConfirmEsignShareMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(({ id }: any) => {
    setIsLoading?.(true);
    return ConfirmEsignShare_API({ id });
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      refetch?.();
      toast.success('تم تأكيد التوقيع الإلكتروني');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useSignEsignShareMutation = ({ setIsLoading, onSuccess }: any) =>
  useMutation(({ id, formData }: any) => {
    setIsLoading?.(true);
    return SignEsignShare_API({ id, formData });
  }, {
    onSuccess: (data) => {
      setIsLoading?.(false);
      onSuccess?.(data);
      toast.success('تم التوقيع بنجاح');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useSaveSigningSignatureMutation = ({ refetch }: any) =>
  useMutation((axiosdata: any) => SaveSigningSignature_API(axiosdata), {
    onSuccess: (response) => {
      syncStoredSigningAssets(response?.data?.assets);
      refetch?.();
      if (!response?.data?.already_saved) {
        toast.success(response?.data?.message || 'تم حفظ التوقيع نهائياً');
      }
    },
    onError: (error: any) => toastApiError(error),
  });

export const useSaveSigningSealMutation = ({ refetch }: any) =>
  useMutation((axiosdata: any) => SaveSigningSeal_API(axiosdata), {
    onSuccess: (response) => {
      syncStoredSigningAssets(response?.data?.assets);
      refetch?.();
      if (!response?.data?.already_saved) {
        toast.success(response?.data?.message || 'تم حفظ الختم نهائياً');
      }
    },
    onError: (error: any) => toastApiError(error),
  });

export const useGetTeamUsers = ({ key, page, search, teamOnly, setIsLoading }: any) =>
  useQuery([key, page, search, teamOnly], () => GetTeamUsers_API({ page, search, teamOnly }), {
    onSettled: () => setIsLoading?.(false),
  });

export const useGetFeaturesCatalog = ({ key }: any) =>
  useQuery([key], () => GetFeaturesCatalog_API());

export const useGetShareRecipients = ({ key, search, scope, enabled = true }: any) =>
  useQuery([key, search, scope], () => GetShareRecipients_API({ search, scope }), { enabled });

export const useCreateTeamUserMutation = ({ setOpen, setIsLoading, refetch }: any) =>
  useMutation((axiosdata: any) => {
    setIsLoading?.(true);
    return CreateTeamUser_API(axiosdata);
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      setOpen?.(false);
      refetch?.();
      toast.success('تم إضافة المستخدم');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useUpdateTeamUserMutation = ({ setOpen, setIsLoading, refetch }: any) =>
  useMutation(({ id, axiosdata }: any) => {
    setIsLoading?.(true);
    return UpdateTeamUser_API({ id, axiosdata });
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      setOpen?.(false);
      refetch?.();
      toast.success('تم تحديث الصلاحيات');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useDeleteTeamUserMutation = ({ setIsLoading, refetch }: any) =>
  useMutation(({ id }: any) => {
    setIsLoading?.(true);
    return DeleteTeamUser_API({ id });
  }, {
    onSuccess: () => {
      setIsLoading?.(false);
      refetch?.();
      toast.success('تم الحذف');
    },
    onError: (error: any) => {
      setIsLoading?.(false);
      toastApiError(error);
    },
  });

export const useGetNotifications = ({
  key = 'GetNotifications_API',
  page = 1,
  enabled = true,
}: any = {}) => {
  const userId = getStoredUser()?.id ?? null;
  const live = isSocketEnabled();
  return useQuery(
    [key, userId, page],
    () => GetNotifications_API({ page, perPage: 20 }),
    {
      enabled: Boolean(userId) && enabled,
      // Live sockets when enabled; otherwise REST poll (cPanel often cannot run Node).
      refetchInterval: live ? false : 45_000,
      refetchOnWindowFocus: !live,
      refetchOnReconnect: true,
      refetchOnMount: !live,
    }
  );
};

export const useGetNotificationsUnreadCount = ({
  key = 'GetNotificationsUnreadCount_API',
  enabled = true,
}: any = {}) => {
  const userId = getStoredUser()?.id ?? null;
  const live = isSocketEnabled();
  return useQuery([key, userId], () => GetNotificationsUnreadCount_API(), {
    enabled: Boolean(userId) && enabled,
    refetchInterval: live ? false : 45_000,
    refetchOnWindowFocus: !live,
    refetchOnReconnect: true,
    refetchOnMount: !live,
  });
};

export const useMarkNotificationReadMutation = ({ refetch }: any = {}) =>
  useMutation(({ id }: { id: number | string }) => MarkNotificationRead_API({ id }), {
    onSuccess: () => {
      refetch?.();
    },
  });

export const useMarkAllNotificationsReadMutation = ({ refetch }: any = {}) =>
  useMutation(() => MarkAllNotificationsRead_API(), {
    onSuccess: () => {
      refetch?.();
      toast.success('تم تعليم الكل كمقروء');
    },
    onError: (error: any) => toastApiError(error),
  });
