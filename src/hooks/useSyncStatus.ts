import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/data";

/** Reactive count of pending outbox entries (mutations awaiting sync). */
export function useSyncStatus() {
  const pending = useLiveQuery(() => db.outbox.count(), [], 0) ?? 0;
  return { pending };
}
