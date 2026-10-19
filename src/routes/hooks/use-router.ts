import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ----------------------------------------------------------------------

type PushOptions = {
  state?: unknown;
  replace?: boolean;
};

export function useRouter() {
  const navigate = useNavigate();

  const router = useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: (href: string, options?: PushOptions) => navigate(href, options),
      replace: (href: string, options?: PushOptions) =>
        navigate(href, { replace: true, state: options?.state }),
    }),
    [navigate]
  );

  return router;
}
