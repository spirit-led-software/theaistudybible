import { onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';

type NetworkState = {
  isOnline: boolean;
  latency: number | null;
  timestamp: number | null;
};

export default function useNetwork(pingInterval = 10_000) {
  const [network, setNetwork] = createStore<NetworkState>({
    isOnline: true,
    latency: null,
    timestamp: null,
  });

  const checkConnection = async () => {
    const startTime = Date.now();

    try {
      const response = await fetch('/api/ping', { method: 'HEAD', cache: 'no-cache' });

      if (response.ok) {
        const latency = Date.now() - startTime;
        setNetwork({ isOnline: true, latency, timestamp: Date.now() });
      } else {
        throw new Error('Network check failed');
      }
    } catch {
      setNetwork({ isOnline: false, latency: null, timestamp: Date.now() });
    }
  };

  onMount(() => {
    checkConnection();
    const interval = setInterval(checkConnection, pingInterval);
    onCleanup(() => clearInterval(interval));
  });

  return {
    network,
    checkConnection,
  } as const;
}
