import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools';
import { Suspense, isServer } from 'solid-js/web';
import { getCookie } from 'vinxi/http';
import './app.css';
import NavigationHeader from './components/nav/header';
import { ClerkProvider } from './components/providers/clerk';
import { Spinner } from './components/ui/spinner';
import { Toaster } from './components/ui/toast';

export function getServerCookies() {
  'use server';
  const colorMode = getCookie('kb-color-mode');
  return colorMode ? `kb-color-mode=${colorMode}` : '';
}

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Router
        root={(props) => (
          <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
              <Suspense
                fallback={
                  <div class="flex h-dvh w-full flex-col items-center justify-center">
                    <Spinner />
                  </div>
                }
              >
                <div class="flex min-h-screen w-full flex-col">
                  <div class="flex flex-1 flex-col">
                    <NavigationHeader />
                    <main class="flex flex-grow flex-col overflow-y-auto">{props.children}</main>
                  </div>
                </div>
              </Suspense>
              <Toaster />
            </ColorModeProvider>
          </ClerkProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </QueryClientProvider>
  );
}
