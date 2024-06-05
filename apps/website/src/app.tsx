import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { Suspense, isServer } from 'solid-js/web';
import { Resource } from 'sst';
import { getCookie } from 'vinxi/http';
import './app.css';
import NavigationHeader from './components/nav/header';
import { ClerkProvider } from './components/providers/clerk';
import {
  PublicResourceProvider,
  type PublicResources
} from './components/providers/public-resource';
import { Spinner } from './components/ui/spinner';
import { Toaster } from './components/ui/toast';

export function getServerCookies() {
  'use server';
  const colorMode = getCookie('kb-color-mode');
  return colorMode ? `kb-color-mode=${colorMode}` : '';
}

export function getPublicResources() {
  'use server';
  return {
    apiUrl: Resource.APIRouter.url
  } satisfies PublicResources;
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
  const publicResources = getPublicResources();
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <PublicResourceProvider resources={publicResources}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <Router
            root={(props) => (
              <>
                <ColorModeScript storageType={storageManager.type} />
                <ColorModeProvider storageManager={storageManager}>
                  <Suspense
                    fallback={
                      <div class="flex h-full w-full items-center justify-center">
                        <Spinner size="lg" />
                      </div>
                    }
                  >
                    <div class="flex h-dvh w-full flex-col">
                      <NavigationHeader />
                      {props.children}
                    </div>
                  </Suspense>
                  <Toaster />
                </ColorModeProvider>
              </>
            )}
          >
            <FileRoutes />
          </Router>
        </ClerkProvider>
      </QueryClientProvider>
    </PublicResourceProvider>
  );
}
