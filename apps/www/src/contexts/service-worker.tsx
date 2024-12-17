import { useRegisterSW } from 'virtual:pwa-register/solid';
import {
  type Accessor,
  type ParentProps,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';
import { toast } from 'solid-sonner';

type ServiceWorkerContextType = {
  registration: Accessor<ServiceWorkerRegistration | undefined>;
};

const ServiceWorkerContext = createContext<ServiceWorkerContextType>();

export const ServiceWorkerProvider = (props: ParentProps) => {
  const [registration, setRegistration] = createSignal<ServiceWorkerRegistration>();

  useRegisterSW({
    onOfflineReady: () => toast.info('App is ready to work offline!'),
    onRegisteredSW: (swUrl, registration) => {
      console.log('Service worker registered:', swUrl);
      if (registration) setRegistration(registration);
    },
    onRegisterError: (error) => {
      console.error('Service worker registration error:', error);
    },
  });

  createEffect(() => {
    const currentRegistration = registration();
    if (currentRegistration) {
      const interval = setInterval(() => currentRegistration.update(), 1000 * 60 * 60 * 24); // check for updates every 24 hours
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
