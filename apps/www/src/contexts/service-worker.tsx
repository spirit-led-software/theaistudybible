import { useRegisterSW } from 'virtual:pwa-register/solid';
import { captureException as captureSentryException } from '@sentry/solidstart';
import {
  type Accessor,
  type ParentProps,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';

type ServiceWorkerContextType = {
  registration: Accessor<ServiceWorkerRegistration | undefined>;
};

const ServiceWorkerContext = createContext<ServiceWorkerContextType>();

export const ServiceWorkerProvider = (props: ParentProps) => {
  const [registration, setRegistration] = createSignal<ServiceWorkerRegistration>();

  useRegisterSW({
    onRegisteredSW: (_, registration) => setRegistration(registration),
    onRegisterError: (error) => captureSentryException(error),
  });

  createEffect(() => {
    const currentRegistration = registration();
    if (currentRegistration) {
      const interval = setInterval(() => currentRegistration.update(), 1000 * 60 * 60); // check for updates every hour
      onCleanup(() => clearInterval(interval));
    }
  });

  return (
    <ServiceWorkerContext.Provider value={{ registration }}>
      {props.children}
    </ServiceWorkerContext.Provider>
  );
};

export const useServiceWorker = () => {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }
  return context;
};
