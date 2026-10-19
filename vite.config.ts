import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import type { Plugin as EsbuildPlugin } from 'esbuild';

const PORT = 3000;

function muiCreateThemeGuard(): EsbuildPlugin {
  return {
    name: 'mui-create-theme-guard',
    setup(build) {
      build.onLoad({ filter: /[\\/]node_modules[\\/]@mui[\\/].*\.js$/ }, async (args) => {
        const contents = await fs.promises.readFile(args.path, 'utf8');
        if (!contents.includes('createTheme()')) {
          return undefined;
        }

        const next = contents.replace(
          /\bcreateTheme\(\)/g,
          '(typeof createTheme === "function" ? createTheme() : {})'
        );

        if (next === contents) {
          return undefined;
        }

        return { contents: next, loader: 'js' };
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv(..., '') includes non-VITE_ keys like API_PROXY_TARGET from .env
  const env = loadEnv(mode, process.cwd(), '');
  const API_PROXY_TARGET = (
    env.API_PROXY_TARGET ||
    env.VITE_API_PROXY_TARGET ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');

  // Browser calls /api/* (same-origin). Retail Laravel serves routes at root (no /api),
  // so strip the prefix when proxying: /api/login → https://host/login
  // secure:false — many cPanel hosts use incomplete intermediate cert chains;
  // Node then fails with "unable to verify the first certificate" and returns 500.
  const apiProxy = {
    target: API_PROXY_TARGET,
    changeOrigin: true,
    secure: false,
    rewrite: (p: string) => p.replace(/^\/api/, '') || '/',
  };

  const storageProxy = {
    target: API_PROXY_TARGET,
    changeOrigin: true,
    secure: false,
  };

  // eslint-disable-next-line no-console
  console.log(`[vite] API proxy → ${API_PROXY_TARGET} (strip /api prefix)`);

  return {
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: /^~(.+)/,
          replacement: path.join(process.cwd(), 'node_modules/$1'),
        },
        {
          find: /^src(.+)/,
          replacement: path.join(process.cwd(), 'src/$1'),
        },
      ],
    },
    optimizeDeps: {
      include: ['apexcharts', 'react-apexcharts'],
      exclude: ['canvas'],
      esbuildOptions: {
        plugins: [muiCreateThemeGuard()],
      },
    },
    server: {
      port: PORT,
      host: true,
      proxy: {
        '/api': apiProxy,
        '/storage': storageProxy,
      },
    },
    preview: {
      port: PORT,
      host: true,
      proxy: {
        '/api': apiProxy,
        '/storage': storageProxy,
      },
    },
  };
});
