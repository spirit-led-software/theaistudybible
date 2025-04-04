import { useRegisterSW } from 'virtual:pwa-register/react';
import { captureException as captureSentryException } from '@sentry/react';
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

type ServiceWorkerContextType = {
  registration: ServiceWorkerRegistration | undefined;
};

const ServiceWorkerContext = createContext<ServiceWorkerContextType | undefined>(undefined);

interface ServiceWorkerProviderProps {
  children: ReactNode;
}

export const ServiceWorkerProvider = ({ children }: ServiceWorkerProviderProps) => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();

  useRegisterSW({
    onRegisteredSW: (_, registration) => setRegistration(registration),
    onRegisterError: (error) => captureSentryException(error),
  });

  useEffect(() => {
    if (registration) {
      const interval = setInterval(() => registration.update(), 1000 * 60 * 60); // check for updates every hour
      return () => clearInterval(interval);
    }
  }, [registration]);

  const value = useMemo(() => ({ registration }), [registration]);

  return <ServiceWorkerContext.Provider value={value}>{children}</ServiceWorkerContext.Provider>;
};

export const useServiceWorker = () => {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }
  return context;
};
