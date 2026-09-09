import { workspaceStateV1Schema } from "@/domain/schemas";
import type { WorkspaceStateV1 } from "@/domain/types";

export const WORKSPACE_STORAGE_KEY = "grain-conference-intelligence:v1";

type WorkspaceFactory = () => WorkspaceStateV1;
type StorageBoundary = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadWorkspace(
  storage: StorageBoundary,
  createFresh: WorkspaceFactory,
): WorkspaceStateV1 {
  const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (raw === null) return createFresh();

  try {
    const result = workspaceStateV1Schema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
  } catch {
    // Invalid browser data is isolated to this application's key below.
  }

  storage.removeItem(WORKSPACE_STORAGE_KEY);
  return createFresh();
}

export function persistWorkspace(
  storage: StorageBoundary,
  state: WorkspaceStateV1,
): void {
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
}

export function resetWorkspaceStorage(storage: StorageBoundary): void {
  storage.removeItem(WORKSPACE_STORAGE_KEY);
}
