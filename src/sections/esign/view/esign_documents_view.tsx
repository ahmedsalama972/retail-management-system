import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import { CheckOutlined } from '@mui/icons-material';

import { DashboardContent } from 'src/layouts/dashboard';
import { CircularLoader } from 'src/utils/CircularLoader';
import { Iconify } from 'src/components/iconify';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import { textGradient } from 'src/theme/styles';
import { useRouter } from 'src/routes/hooks';
import {
  autocompleteRtlSx,
  fieldContainerSx,
  formFieldSx,
  formInputLabelSx,
} from 'src/components/utils/field-styles';
import {
  useConfirmEsignShareMutation,
  useDeleteEsignLibraryMutation,
  useForwardEsignShareMutation,
  useGetEsignInbox,
  useGetEsignInboxCounts,
  useGetEsignLibrary,
  useGetEsignLibraryCounts,
  useGetEsignShares,
  useGetShareRecipients,
  useReturnEsignShareMutation,
  useShareEsignDocumentMutation,
} from 'src/hooks/customHooks';
import { PartsTableHead } from 'src/sections/legal-cases/parts-table-head';
import { PartTableToolbar } from 'src/sections/legal-cases/part-table-toolbar';
import { TableNoData } from 'src/sections/legal-cases/table-no-data';
import { fileUrl, formatDate } from 'src/sections/legal-cases/utils';
import {
  canShareDocuments,
  canUploadDocuments,
  getStoredUser,
  hasFeature,
  isCompanyUser,
} from 'src/utils/user-role';

type Variant = 'library' | 'inbox';
type ShareMode = 'library' | 'forward';

const arabicNumberFormat = new Intl.NumberFormat('ar-EG');

function statusLabel(row: any) {
  const status = row.status || (row.signed ? 'signed' : 'pending');
  if (status === 'confirmed') return 'مؤكد التوقيع';
  if (status === 'returned') return 'بانتظار التأكيد';
  if (status === 'signed' || row.signed) return 'موقع';
  return 'غير موقع';
}

export function EsignDocumentsView({ variant }: { variant: Variant }) {
  const router = useRouter();
  const isLibrary = variant === 'library';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(isLibrary ? 'all' : 'unsigned');
  const [isLoading, setIsLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('library');
  const [shareEmails, setShareEmails] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const currentUser = getStoredUser();
  const canUpload = canUploadDocuments(currentUser);
  const canShare = canShareDocuments(currentUser);
  const canSign = hasFeature(currentUser, 'sign_documents') || isCompanyUser(currentUser);

  const signedParam = status === 'signed' ? 1 : status === 'unsigned' ? 0 : undefined;
  const recipientScope = shareMode === 'forward' ? 'team' : 'external';

  const showLibraryDocs = isLibrary && status === 'all';
  const showLibraryShares = isLibrary && status !== 'all';

  const libraryQuery = useGetEsignLibrary({
    key: 'GetEsignLibrary_API',
    page,
    search,
    setIsLoading,
    enabled: showLibraryDocs,
  });
  const sharesQuery = useGetEsignShares({
    key: 'GetEsignShares_API',
    page,
    search,
    signed: signedParam,
    setIsLoading,
    enabled: showLibraryShares,
  });
  const inboxQuery = useGetEsignInbox({
    key: 'GetEsignInbox_API',
    page,
    search,
    signed: signedParam ?? 0,
    setIsLoading,
    enabled: !isLibrary,
  });
  const inboxCountsQuery = useGetEsignInboxCounts({
    key: 'GetEsignInboxCounts_API',
    enabled: !isLibrary,
  });
  const libraryCountsQuery = useGetEsignLibraryCounts({
    key: 'GetEsignLibraryCounts_API',
    enabled: isLibrary,
  });
  const recipientsQuery = useGetShareRecipients({
    key: 'GetShareRecipients_API',
    search: '',
    scope: recipientScope,
    enabled: shareOpen,
  });
  const recipientOptions = recipientsQuery.data?.data?.data || [];

  const activeQuery = showLibraryDocs ? libraryQuery : showLibraryShares ? sharesQuery : inboxQuery;
  const rows = activeQuery.data?.data?.data || [];
  const total = activeQuery.data?.data?.total || 0;
  const counts = (isLibrary ? libraryCountsQuery.data?.data?.data : inboxCountsQuery.data?.data?.data) || {};

  const refetchAll = () => {
    if (showLibraryDocs) libraryQuery.refetch();
    if (showLibraryShares) sharesQuery.refetch();
    if (!isLibrary) inboxQuery.refetch();
    if (!isLibrary) inboxCountsQuery.refetch();
    if (isLibrary) libraryCountsQuery.refetch();
  };

  const { mutate: shareDoc } = useShareEsignDocumentMutation({
    setOpen: setShareOpen,
    setIsLoading,
    refetch: refetchAll,
  });
  const { mutate: forwardDoc } = useForwardEsignShareMutation({
    setOpen: setShareOpen,
    setIsLoading,
    refetch: refetchAll,
  });
  const { mutate: returnDoc } = useReturnEsignShareMutation({
    setIsLoading,
    refetch: refetchAll,
  });
  const { mutate: confirmDoc } = useConfirmEsignShareMutation({
    setIsLoading,
    refetch: refetchAll,
  });
  const { mutate: deleteDoc } = useDeleteEsignLibraryMutation({
    setIsLoading,
    refetch: refetchAll,
  });

  const title = isLibrary ? 'ملفات الشركة' : 'الملفات الواردة';
  const tabs = useMemo(() => {
    const n = (value: number | undefined) => arabicNumberFormat.format(value || 0);
    if (isLibrary) {
      return [
        { value: 'all', label: `الكل (${n(counts.all)})` },
        { value: 'unsigned', label: `غير موقع (${n(counts.unsigned)})` },
        { value: 'signed', label: `موقع / مؤكد (${n(counts.signed)})` },
      ];
    }
    return [
      { value: 'unsigned', label: `غير موقع (${n(counts.unsigned)})` },
      { value: 'signed', label: `موقع (${n(counts.signed)})` },
    ];
  }, [isLibrary, counts]);

  const openLibraryShare = (row: any) => {
    setShareMode('library');
    setSelectedDoc(row);
    setShareEmails('');
    setSelectedRecipients([]);
    setShareOpen(true);
  };

  const openForwardShare = (row: any) => {
    setShareMode('forward');
    setSelectedDoc(row);
    setShareEmails('');
    setSelectedRecipients([]);
    setShareOpen(true);
  };

  // Team forward only after this account has signed (team always gets the signed file)
  const canForwardRow = (row: any) =>
    canShare &&
    !isLibrary &&
    Boolean(row.signed || row.status === 'signed') &&
    Boolean(row.signed_file_path || row.signaturedfile) &&
    row.status !== 'confirmed' &&
    row.status !== 'returned';

  const canReturnRow = (row: any) =>
    !isLibrary &&
    canShare &&
    (row.signed || row.status === 'signed') &&
    row.status !== 'returned' &&
    row.status !== 'confirmed';

  const canConfirmRow = (row: any) =>
    (canUpload || isCompanyUser(currentUser)) && row.status === 'returned';

  return (
    <DashboardContent>
      {isLoading && <CircularLoader />}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={() => ({ ...textGradient(`to right, #000, rgb(12, 68, 174)`) })}>
          {title}
        </Typography>
        {isLibrary && canUpload && (
          <Button variant="contained" color="inherit" onClick={() => router.push('/esign/generate')}>
            إنشاء ملف
          </Button>
        )}
      </Box>

      <Card>
        <Tabs
          value={status}
          onChange={(_, value) => {
            setStatus(value);
            setPage(1);
          }}
          sx={{ px: 2, pt: 1 }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        <PartTableToolbar
          filterName={search}
          placeholder="بحث...."
          onFilterName={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <PartsTableHead
              headLabel={
                isLibrary && status === 'all'
                  ? [
                      { id: 'no', label: 'م' },
                      { id: 'name', label: 'اسم المستند' },
                      { id: 'key', label: 'كود المستند' },
                      { id: 'date', label: 'التاريخ' },
                      { id: 'actions', label: 'إجراءات' },
                    ]
                  : [
                      { id: 'no', label: 'م' },
                      { id: 'name', label: 'اسم المستند' },
                      { id: isLibrary ? 'email' : 'company', label: isLibrary ? 'المستلم' : 'الشركة' },
                      { id: 'status', label: 'الحالة' },
                      { id: 'date', label: 'التاريخ' },
                      { id: 'actions', label: 'إجراءات' },
                    ]
              }
            />
            <TableBody>
              {rows.map((row: any, index: number) => (
                <TableRow hover key={row.id}>
                  <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                  <TableCell align="right">{row.contractname || row.document_name || '-'}</TableCell>
                  {isLibrary && status === 'all' ? (
                    <>
                      <TableCell align="right">{row.contractid || row.document_key}</TableCell>
                      <TableCell align="right">{formatDate(row.created_at)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                          {(row.file_url || row.file_path || row.contractfile) && (
                            <Tooltip title="تحميل">
                              <IconButton
                                size="small"
                                color="primary"
                                component="a"
                                href={fileUrl(row.file_path || row.contractfile)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Iconify icon="solar:download-minimalistic-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canShare && (
                            <Tooltip title="إرسال للتوقيع">
                              <IconButton size="small" color="primary" onClick={() => openLibraryShare(row)}>
                                <Iconify icon="solar:plain-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canUpload && (
                            <Tooltip title="حذف">
                              <IconButton size="small" color="error" onClick={() => deleteDoc({ id: row.id })}>
                                <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="right">
                        {isLibrary ? row.email || row.username : row.company_name || '-'}
                      </TableCell>
                      <TableCell align="right">{statusLabel(row)}</TableCell>
                      <TableCell align="right">{formatDate(row.signed_at || row.returned_at || row.created_at)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap' }}>
                          {!row.signed &&
                            !isLibrary &&
                            row.status !== 'returned' &&
                            row.status !== 'confirmed' &&
                            canSign && (
                              <Tooltip title="توقيع">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => router.push(`/esign/sign/${row.id}`)}
                                >
                                  <Iconify icon="solar:pen-bold" width={20} />
                                </IconButton>
                              </Tooltip>
                            )}
                          {canForwardRow(row) && (
                            <Tooltip title="لفريق الشركة">
                              <IconButton size="small" color="primary" onClick={() => openForwardShare(row)}>
                                <Iconify icon="solar:users-group-rounded-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canReturnRow(row) && (
                            <Tooltip title="إرجاع للشركة الأصلية">
                              <IconButton size="small" color="secondary" onClick={() => returnDoc({ id: row.id })}>
                                <Iconify icon="solar:reply-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canConfirmRow(row) && (
                            <Tooltip title="تأكيد التوقيع الإلكتروني">
                              <IconButton size="small" color="success" onClick={() => confirmDoc({ id: row.id })}>
                                <Iconify icon="solar:check-circle-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(row.file_url || row.file_path || row.signed_file_path) && (
                            <Tooltip title="تحميل">
                              <IconButton
                                size="small"
                                color="primary"
                                component="a"
                                href={fileUrl(row.signed_file_path || row.file_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Iconify icon="solar:download-minimalistic-bold" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {rows.length === 0 && <TableNoData searchQuery={search} />}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          sx={{ float: 'left' }}
          dir="ltr"
          component="div"
          page={page - 1}
          count={total}
          rowsPerPage={10}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) =>
            `عرض ${arabicNumberFormat.format(from)}–${arabicNumberFormat.format(to)} من ${
              count !== -1 ? arabicNumberFormat.format(count) : `أكثر من ${arabicNumberFormat.format(to)}`
            }`
          }
        />
      </Card>

      <ModalContainer
        modalState={shareOpen}
        modalChangeState={() => setShareOpen(false)}
        modalTitle={shareMode === 'forward' ? 'إرسال لفريق الشركة للتوقيع' : 'إرسال مستند للتوقيع'}
        btnTitle="إرسال"
        endIcon={<CheckOutlined sx={{ marginRight: 2 }} />}
        modalAction={() => {
          if (!selectedDoc) return;
          if (shareMode === 'forward') {
            forwardDoc({
              id: selectedDoc.id,
              axiosdata: { user_ids: selectedRecipients.map((item) => item.id) },
            });
            return;
          }
          shareDoc({
            library_id: selectedDoc.id,
            user_ids: selectedRecipients.map((item) => item.id),
            emails: shareEmails,
          });
        }}
      >
        <Typography sx={{ mb: 2 }} color="text.secondary">
          {shareMode === 'forward'
            ? 'سيتم إرسال النسخة الموقّعة من قبلك إلى أعضاء فريق شركتك فقط لإضافة توقيعاتهم.'
            : 'أرسل المستند لشركة أخرى أو مستخدم للتوقيع. يجب على المستلم التوقيع أولاً ثم يمكنه إرساله لفريقه.'}
        </Typography>
        <Box sx={fieldContainerSx}>
          <InputLabel sx={formInputLabelSx}>
            {shareMode === 'forward' ? 'فريق الشركة' : 'المستخدمون / الشركات'}
          </InputLabel>
          <Autocomplete
            multiple
            options={recipientOptions}
            value={selectedRecipients}
            onChange={(_, value) => setSelectedRecipients(value)}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={undefined}
                placeholder={shareMode === 'forward' ? 'اختر من فريق شركتك' : 'اختر شركة أو مستخدماً'}
                sx={[formFieldSx, autocompleteRtlSx] as any}
                InputProps={{
                  ...params.InputProps,
                  notched: false,
                }}
              />
            )}
            sx={{
              width: '100%',
              ...autocompleteRtlSx,
              '& .MuiOutlinedInput-root, & .MuiAutocomplete-inputRoot': {
                height: 'auto !important',
                minHeight: 48,
                flexWrap: 'wrap',
                py: '6px !important',
              },
            }}
          />
        </Box>
        {shareMode === 'library' && (
          <TextInputComponent
            name="بريد إضافي (اختياري)"
            type="text"
            value={shareEmails}
            refState={(e: any) => setShareEmails(e.target.value)}
          />
        )}
      </ModalContainer>
    </DashboardContent>
  );
}
