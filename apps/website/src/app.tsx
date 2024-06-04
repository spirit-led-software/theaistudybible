import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { Suspense, isServer } from 'solid-js/web';
import { Resource } from 'sst';
import { getCookie } from 'vinxi/http';
import NavigationHeader from './components/nav/header';
import { ClerkProvider } from './components/providers/clerk';
import { PublicResourceProvider } from './components/providers/public-resource';
import { Toaster } from './components/ui/toast';

import './app.css';

function getServerCookies() {
  'use server';
  const colorMode = getCookie('kb-color-mode');
  return colorMode ? `kb-color-mode=${colorMode}` : '';
}

function getPublicResources() {
  'use server';
  return {
    chatApi: Resource.ChatAPIFunction
  };
}

function getClerkPublishableKey() {
  'use server';
  return process.env.PUBLIC_CLERK_PUBLISHABLE_KEY;
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
    <PublicResourceProvider resources={getPublicResources()}>
      <ClerkProvider publishableKey={getClerkPublishableKey()}>
        <QueryClientProvider client={queryClient}>
          <Router
            root={(props) => (
              <>
                <ColorModeScript storageType={storageManager.type} />
                <ColorModeProvider storageManager={storageManager}>
                  <NavigationHeader />
                  <Suspense>{props.children}</Suspense>
                  <Toaster />
                </ColorModeProvider>
              </>
            )}
          >
            <FileRoutes />
          </Router>
        </QueryClientProvider>
      </ClerkProvider>
    </PublicResourceProvider>
  );
}
