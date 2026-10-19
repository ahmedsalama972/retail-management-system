import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import { CheckOutlined } from '@mui/icons-material';
import { Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import AutocompleteComponent from 'src/components/utils/AutoCompleteComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import { textGradient } from 'src/theme/styles';
import { Iconify } from 'src/components/iconify';
import IconButton from '@mui/material/IconButton';
import {
  useCreateTeamUserMutation,
  useDeleteTeamUserMutation,
  useGetFeaturesCatalog,
  useGetTeamUsers,
  useUpdateTeamUserMutation,
} from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { PartTableToolbar } from 'src/sections/legal-cases/part-table-toolbar';
import { FEATURE_KEYS, FEATURE_LABELS, isAdminUser, getStoredUser, type FeatureKey } from 'src/utils/user-role';

type Props = {
  mode?: 'team' | 'admin';
};

const memberTypes = [
  { id: 1, name: 'موظف' },
  { id: 2, name: 'موظف قانوني' },
  { id: 3, name: 'مشرف' },
  { id: 4, name: 'شركة' },
];

export function TeamUsersView({ mode = 'team' }: Props) {
  const currentUser = getStoredUser();
  const isAdminMode = mode === 'admin' || isAdminUser(currentUser);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [payload, setPayload] = useState({
    name: '',
    email: '',
    password: '',
    type: memberTypes[0],
    work_type: 'فريق العمل',
  });

  const { data, refetch } = useGetTeamUsers({
    key: isAdminMode ? 'GetAllManagedUsers_API' : 'GetTeamUsers_API',
    page,
    search,
    teamOnly: !isAdminMode,
    setIsLoading,
  });
  const { data: catalogData } = useGetFeaturesCatalog({ key: 'GetFeaturesCatalog_API' });
  const catalog = catalogData?.data?.data || FEATURE_KEYS.map((id) => ({ id, name: FEATURE_LABELS[id] }));

  const { mutate: createUser } = useCreateTeamUserMutation({
    setOpen,
    setIsLoading,
    refetch,
  });
  const { mutate: updateUser } = useUpdateTeamUserMutation({
    setOpen: setEditOpen,
    setIsLoading,
    refetch,
  });
  const { mutate: deleteUser } = useDeleteTeamUserMutation({ setIsLoading, refetch });

  const rows = data?.data?.data || [];
  const title = isAdminMode ? 'المستخدمون والصلاحيات' : 'فريق العمل';

  const featureList = useMemo(
    () =>
      (catalog as any[]).filter((item) => {
        // Upload is reserved for company/admin account types — not assignable via checkbox
        if (item.id === 'upload_documents') return false;
        if (!isAdminMode && (item.id === 'manage_users' || item.id === 'legal_module')) return false;
        return true;
      }),
    [catalog, isAdminMode]
  );

  const openCreate = () => {
    setPayload({
      name: '',
      email: '',
      password: '',
      type: memberTypes[0],
      work_type: 'فريق العمل',
    });
    setFeatures({
      view_inbox: true,
      sign_documents: true,
      upload_documents: false,
      view_library: false,
      share_documents: false,
      manage_team: false,
      legal_module: false,
      manage_users: false,
    });
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setSelected(row);
    setFeatures({ ...(row.features || {}) });
    setEditOpen(true);
  };

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}
      <Toaster richColors expand={false} duration={5000} />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={() => ({ ...textGradient(`to right, #000, rgb(12, 68, 174)`) })}>
          {title}
        </Typography>
        <Button variant="contained" color="inherit" onClick={openCreate}>
          إضافة مستخدم
        </Button>
      </Box>

      <Card>
        <PartTableToolbar
          filterName={search}
          placeholder="بحث بالاسم أو البريد...."
          onFilterName={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Table>
          <PartsTableHead
            headLabel={[
              { id: 'name', label: 'الاسم' },
              { id: 'email', label: 'البريد' },
              { id: 'type', label: 'النوع' },
              { id: 'parent', label: 'يتبع' },
              { id: 'features', label: 'الصلاحيات' },
              { id: 'actions', label: '' },
            ]}
          />
          <TableBody>
            {rows.map((row: any) => (
              <TableRow key={row.id} hover>
                <TableCell align="right">{row.name}</TableCell>
                <TableCell align="right">{row.email}</TableCell>
                <TableCell align="right">{row.type}</TableCell>
                <TableCell align="right">{row.parent?.name || '-'}</TableCell>
                <TableCell align="right" sx={{ maxWidth: 280, fontSize: 12 }}>
                  {FEATURE_KEYS.filter((key) => row.features?.[key])
                    .map((key) => FEATURE_LABELS[key])
                    .join(' · ') || '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(row)}>
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                  <IconButton color="error" onClick={() => deleteUser({ id: row.id })}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ModalContainer
        modalState={open}
        modalChangeState={() => setOpen(false)}
        modalTitle="إضافة مستخدم للفريق"
        btnTitle="تسجيل"
        endIcon={<CheckOutlined sx={{ marginRight: 2 }} />}
        modalAction={() => {
          createUser({
            ...payload,
            type: payload.type?.name || payload.type,
            features,
          });
        }}
      >
        <TextInputComponent name="الاسم" type="text" value={payload.name} refState={(e: any) => setPayload((p) => ({ ...p, name: e.target.value }))} />
        <TextInputComponent name="البريد الالكتروني" type="email" value={payload.email} refState={(e: any) => setPayload((p) => ({ ...p, email: e.target.value }))} />
        <TextInputComponent name="كلمة المرور" type="password" value={payload.password} refState={(e: any) => setPayload((p) => ({ ...p, password: e.target.value }))} />
        <AutocompleteComponent name="النوع" value={payload.type} refState={(e: any) => setPayload((p) => ({ ...p, type: e }))} data={isAdminMode ? [...memberTypes, { id: 5, name: 'مدير' }, { id: 6, name: 'شركة' }] : memberTypes} />
        <TextInputComponent name="طبيعة العمل" type="text" value={payload.work_type} refState={(e: any) => setPayload((p) => ({ ...p, work_type: e.target.value }))} />
        <Typography sx={{ mt: 1, mb: 1, fontWeight: 700 }}>صلاحيات الوصول</Typography>
        <FormGroup>
          {featureList.map((item: any) => (
            <FormControlLabel
              key={item.id}
              control={
                <Checkbox
                  checked={Boolean(features[item.id as FeatureKey])}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                />
              }
              label={item.name}
            />
          ))}
        </FormGroup>
      </ModalContainer>

      <ModalContainer
        modalState={editOpen}
        modalChangeState={() => setEditOpen(false)}
        modalTitle={`تعديل صلاحيات: ${selected?.name || ''}`}
        btnTitle="حفظ"
        endIcon={<CheckOutlined sx={{ marginRight: 2 }} />}
        modalAction={() => {
          if (!selected) return;
          updateUser({ id: selected.id, axiosdata: { features } });
        }}
      >
        <FormGroup>
          {featureList.map((item: any) => (
            <FormControlLabel
              key={item.id}
              control={
                <Checkbox
                  checked={Boolean(features[item.id as FeatureKey])}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                />
              }
              label={item.name}
            />
          ))}
        </FormGroup>
      </ModalContainer>
    </DashboardContent>
  );
}
