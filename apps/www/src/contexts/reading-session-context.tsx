import {
  endReadingSession,
  startReadingSession,
  updateUserCredits,
} from '@/www/server/reading-tracker';
import { makePersisted } from '@solid-primitives/storage';
import { useQueryClient } from '@tanstack/solid-query';
import type { JSXElement } from 'solid-js';
import { createContext, createSignal, onCleanup, onMount, useContext } from 'solid-js';

const SESSION_ID_KEY = 'reading_session_id';
const LAST_ACTIVITY_KEY = 'last_reading_activity';

type ReadingSessionContextType = {
  updateActivity: () => void;
  startReading: () => void;
  stopReading: () => Promise<void>;
  isReading: () => boolean;
};

const ReadingSessionContext = createContext<ReadingSessionContextType | undefined>(undefined);

export function ReadingSessionProvider(props: { children: JSXElement }) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = makePersisted(createSignal<string | null>(null), {
    name: SESSION_ID_KEY,
  });
  const [lastActivity, setLastActivity] = makePersisted(createSignal(0), {
    name: LAST_ACTIVITY_KEY,
    serialize: (value) => value.toString(),
    deserialize: (value) => parseInt(value),
  });
  const [isReading, setIsReading] = createSignal(false);
  const [lastCreditUpdate, setLastCreditUpdate] = createSignal(Date.now());

  const updateActivity = () => {
    if (isReading()) {
      const now = Date.now();
      setLastActivity(now);
    } else {
      startReading();
    }
  };

  const startNewSession = async () => {
    if (isReading()) {
      const id = await startReadingSession();
      setSessionId(id);
      updateActivity();
    }
  };

  const startReading = () => {
    if (!isReading()) {
      setIsReading(true);
      if (!sessionId()) {
        void startNewSession();
      }
    }
  };

  const stopReading = async () => {
    setIsReading(false);
    const session = sessionId();
    if (session) {
      await endReadingSession(session);
      setSessionId(null);
    }
  };

  onMount(() => {
    const checkInterval = setInterval(async () => {
      if (isReading()) {
        if (sessionId()) {
          const now = Date.now();
          const lastActivityTime = lastActivity();

          if (now - lastActivityTime > 5 * 60 * 1000) {
            // 5 minutes of inactivity
            await stopReading();
          } else {
            const timeSinceLastCreditUpdate = now - lastCreditUpdate();
            console.log('timeSinceLastCreditUpdate', timeSinceLastCreditUpdate);
            // If active, update credits based on time since last check
            if (timeSinceLastCreditUpdate >= 10 * 60 * 1000) {
              const creditsToAdd = Math.floor(timeSinceLastCreditUpdate / (10 * 60 * 1000)) * 3; // 3 credits per 10 minutes
              await updateUserCredits(creditsToAdd);
              void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
              setLastCreditUpdate(Date.now());
            }
          }
        } else {
          await startNewSession();
        }
      }
    }, 60000); // Check every minute

    onCleanup(() => {
      clearInterval(checkInterval);
      void stopReading();
    });
  });

  const contextValue: ReadingSessionContextType = {
    updateActivity,
    startReading,
    stopReading,
    isReading,
  };

  return (
    <ReadingSessionContext.Provider value={contextValue}>
      {props.children}
    </ReadingSessionContext.Provider>
  );
}

export function useReadingSessionContext() {
  const context = useContext(ReadingSessionContext);
  if (!context) {
    throw new Error('useReadingSessionContext must be used within a ReadingSessionProvider');
  }
  return context;
}
