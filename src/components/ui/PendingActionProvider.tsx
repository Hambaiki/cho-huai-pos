"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { PendingActionModal } from "@/components/ui/PendingActionModal";

interface PendingActionConfig {
  message?: string;
  subMessage?: string;
}

interface PendingActionContextValue {
  setPendingAction: (id: string, config: PendingActionConfig) => void;
  clearPendingAction: (id: string) => void;
}

const PendingActionContext = createContext<PendingActionContextValue | null>(
  null,
);

interface PendingActionProviderProps {
  children: React.ReactNode;
}

export function PendingActionProvider({
  children,
}: PendingActionProviderProps) {
  const [entries, setEntries] = useState<
    Array<{ id: string; config: PendingActionConfig }>
  >([]);

  const setPendingAction = useCallback(
    (id: string, config: PendingActionConfig) => {
      setEntries((current) => {
        const index = current.findIndex((entry) => entry.id === id);
        if (index === -1) {
          return [...current, { id, config }];
        }

        const next = [...current];
        next[index] = { id, config };
        return next;
      });
    },
    [],
  );

  const clearPendingAction = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const contextValue = useMemo(
    () => ({ setPendingAction, clearPendingAction }),
    [setPendingAction, clearPendingAction],
  );

  const activeConfig =
    entries.length > 0 ? entries[entries.length - 1].config : null;

  return (
    <PendingActionContext.Provider value={contextValue}>
      {children}
      <PendingActionModal
        open={Boolean(activeConfig)}
        message={activeConfig?.message}
        subMessage={activeConfig?.subMessage}
      />
    </PendingActionContext.Provider>
  );
}

function usePendingActionContext() {
  const context = useContext(PendingActionContext);

  if (!context) {
    throw new Error(
      "useSyncPendingAction must be used within PendingActionProvider",
    );
  }

  return context;
}

export function useSyncPendingAction(
  open: boolean,
  config: PendingActionConfig,
) {
  const { setPendingAction, clearPendingAction } = usePendingActionContext();
  const id = useId();
  const { message, subMessage } = config;

  useEffect(() => {
    if (open) {
      setPendingAction(id, { message, subMessage });
      return;
    }
    clearPendingAction(id);
  }, [open, message, subMessage, id, setPendingAction, clearPendingAction]);

  useEffect(() => {
    return () => {
      clearPendingAction(id);
    };
  }, [id, clearPendingAction]);
}
