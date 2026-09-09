"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { createDemoWorkspace } from "@/data/demo-workspace";
import type { WorkspaceAction, WorkspaceStateV1 } from "@/domain/types";
import { workspaceReducer } from "@/workspace/reducer";
import { loadWorkspace, persistWorkspace, resetWorkspaceStorage } from "@/workspace/state";

interface WorkspaceContextValue {
  state: WorkspaceStateV1;
  hydrated: boolean;
  dispatch: Dispatch<WorkspaceAction>;
  resetWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, createDemoWorkspace);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const storedState = loadWorkspace(window.localStorage, createDemoWorkspace);

    queueMicrotask(() => {
      if (cancelled) return;
      dispatch({ type: "workspace/replace", state: storedState });
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) persistWorkspace(window.localStorage, state);
  }, [hydrated, state]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      hydrated,
      dispatch,
      resetWorkspace: () => {
        resetWorkspaceStorage(window.localStorage);
        dispatch({ type: "workspace/reset", state: createDemoWorkspace() });
      },
    }),
    [hydrated, state],
  );

  if (!hydrated) {
    return (
      <div className="workspace-loading" role="status" aria-live="polite">
        Loading conference workspace…
      </div>
    );
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
