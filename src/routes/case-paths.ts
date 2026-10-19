const LIST_BASE_PATHS = ['/legal-issues', '/pending-legal-issues', '/legal-cases'] as const;

export type ListBasePath = (typeof LIST_BASE_PATHS)[number];

/** Resolve which list section the current URL belongs to. */
export function getListBasePath(pathname = window.location.pathname): ListBasePath {
  const match = LIST_BASE_PATHS.find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  return match || '/legal-cases';
}

export function caseDetailsPath(id: string | number, pathname?: string) {
  return `${getListBasePath(pathname)}/${id}`;
}

export function caseSignPath(id: string | number, pathname?: string) {
  return `${getListBasePath(pathname)}/${id}/sign`;
}

export { LIST_BASE_PATHS };
