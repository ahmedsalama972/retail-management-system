import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { CheckOutlined } from '@mui/icons-material';
import { Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import ModalContainer from 'src/components/utils/ModalContainer';
import { ConfirmDeleteDialog } from 'src/components/utils/ConfirmDeleteDialog';
import {
  useAddLookupMutation,
  useDeleteLookupMutation,
  useGetLookups,
} from 'src/hooks/customHooks';

type Level = 'governorate' | 'police_station' | 'circuit';

const LEVEL_META: Record<Level, { title: string; parentType?: Level; label: string }> = {
  governorate: { title: 'المحافظات', label: 'محافظة' },
  police_station: { title: 'الأقسام', parentType: 'governorate', label: 'قسم' },
  circuit: { title: 'الدوائر', parentType: 'police_station', label: 'دائرة' },
};

type Props = {
  /** When true, render only the cascade UI (no page chrome) for embedding in settings */
  embedded?: boolean;
  onChanged?: () => void;
};

export function GeoRegionsView({ embedded = false, onChanged }: Props) {
  const [selectedGov, setSelectedGov] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addLevel, setAddLevel] = useState<Level>('governorate');
  const [name, setName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const { data, refetch } = useGetLookups({ key: 'GetLookups_API_Geo' });
  const { mutate: addLookup } = useAddLookupMutation({
    refetch: () => {
      refetch();
      onChanged?.();
    },
  });
  const { mutate: deleteLookup } = useDeleteLookupMutation({
    refetch: () => {
      refetch();
      onChanged?.();
    },
  });

  const rows = data?.data?.data || [];

  const governorates = useMemo(
    () => rows.filter((item: any) => item.type === 'governorate'),
    [rows]
  );
  const stations = useMemo(
    () =>
      rows.filter(
        (item: any) => item.type === 'police_station' && item.parent_id === selectedGov?.id
      ),
    [rows, selectedGov]
  );
  const circuits = useMemo(
    () =>
      rows.filter(
        (item: any) => item.type === 'circuit' && item.parent_id === selectedStation?.id
      ),
    [rows, selectedStation]
  );

  const openAdd = (level: Level) => {
    if (level === 'police_station' && !selectedGov) return;
    if (level === 'circuit' && !selectedStation) return;
    setAddLevel(level);
    setName('');
    setAddOpen(true);
  };

  const parentIdForAdd =
    addLevel === 'police_station'
      ? selectedGov?.id
      : addLevel === 'circuit'
        ? selectedStation?.id
        : null;

  const renderColumn = (
    level: Level,
    items: any[],
    selected: any,
    onSelect: (item: any) => void,
    disabledAdd?: boolean
  ) => (
    <Card
      sx={{
        height: 1,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>{LEVEL_META[level].title}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
            {items.length} عنصر
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          disabled={disabledAdd}
          startIcon={<Iconify icon="mingcute:add-line" width={16} />}
          onClick={() => openAdd(level)}
          sx={{ fontWeight: 800, borderRadius: 2 }}
        >
          إضافة
        </Button>
      </Box>
      <List dense sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        {items.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
              {disabledAdd
                ? `اختر ${LEVEL_META[LEVEL_META[level].parentType!].label} أولاً`
                : 'لا توجد بيانات بعد'}
            </Typography>
          </Box>
        ) : (
          items.map((item: any) => (
            <ListItemButton
              key={item.id}
              selected={selected?.id === item.id}
              onClick={() => onSelect(item)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': { bgcolor: 'rgba(26,41,66,0.08)' },
              }}
            >
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{ fontWeight: 700, fontSize: 13.5 }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteRow(item);
                  setDeleteOpen(true);
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </ListItemButton>
          ))
        )}
      </List>
    </Card>
  );

  const content = (
    <>
      {!embedded && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
            المحافظات والأقسام والدوائر
          </Typography>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.secondary' }}>
            أضف المحافظة ثم الأقسام التابعة لها، ثم الدوائر التابعة لكل قسم. عند اختيار المحافظة في نماذج الجنح تُفلتر
            الأقسام والدوائر تلقائياً.
          </Typography>
        </Box>
      )}

      {embedded && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: 'primary.main', mb: 0.5 }}>
            المحافظات والأقسام والدوائر
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
            أضف المحافظة ثم الأقسام التابعة لها، ثم الدوائر التابعة لكل قسم.
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          {renderColumn('governorate', governorates, selectedGov, (item) => {
            setSelectedGov(item);
            setSelectedStation(null);
          })}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderColumn(
            'police_station',
            stations,
            selectedStation,
            (item) => setSelectedStation(item),
            !selectedGov
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderColumn('circuit', circuits, null, () => {}, !selectedStation)}
        </Grid>
      </Grid>

      <ModalContainer
        modalState={addOpen}
        modalChangeState={() => setAddOpen(false)}
        modalTitle={`إضافة ${LEVEL_META[addLevel].label}`}
        modalSubtitle={
          addLevel === 'governorate'
            ? 'إضافة محافظة جديدة'
            : addLevel === 'police_station'
              ? `قسم تابع لمحافظة ${selectedGov?.name || ''}`
              : `دائرة تابعة لقسم ${selectedStation?.name || ''}`
        }
        btnTitle="تسجيل"
        endIcon={<CheckOutlined />}
        modalAction={() => {
          if (!name.trim()) return;
          addLookup({
            type: addLevel,
            name: name.trim(),
            parent_id: parentIdForAdd,
          });
          setAddOpen(false);
          setName('');
        }}
      >
        <TextInputComponent
          name="الاسم"
          type="text"
          value={name}
          refState={(e: any) => setName(e.target.value)}
        />
      </ModalContainer>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="حذف البيان"
        message={`هل أنت متأكد من حذف "${deleteRow?.name || ''}"؟`}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
        onConfirm={() => {
          if (deleteRow?.id) {
            deleteLookup({ id: deleteRow.id });
            if (selectedGov?.id === deleteRow.id) {
              setSelectedGov(null);
              setSelectedStation(null);
            }
            if (selectedStation?.id === deleteRow.id) setSelectedStation(null);
          }
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
      />
    </>
  );

  if (embedded) {
    return <Box sx={{ mb: 2.5 }}>{content}</Box>;
  }

  return (
    <DashboardContent>
      <Toaster richColors expand={false} duration={5000} />
      {content}
    </DashboardContent>
  );
}
