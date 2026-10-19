import { resolveFilesBaseUrl } from 'src/utils/api-base';

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

export function getComparator<Key extends keyof any>(order: 'asc' | 'desc', orderBy: Key) {
  return order === 'desc'
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ar-EG');
}

export function fileUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  // Same-origin when using /api proxy; otherwise the API host (without /api).
  const base = resolveFilesBaseUrl();
  const relative = path.startsWith('/storage/')
    ? path
    : path.startsWith('storage/')
      ? `/${path}`
      : `/storage/${path.replace(/^\//, '')}`;
  return `${base}${relative}`;
}

/** الفرع / الشركة — contract branch, then contract company, then client employer */
export function getCompanyName(row: any): string {
  const name =
    row?.contract?.branch_name ||
    row?.contract?.company_name ||
    row?.client?.company_name ||
    row?.contract?.client?.company_name ||
    '';
  return String(name).trim();
}

export function collectCompanyNames(rows: any[] = []): string[] {
  return Array.from(new Set(rows.map(getCompanyName).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'ar')
  );
}
