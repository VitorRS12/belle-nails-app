import { useEffect, useRef, useCallback } from "react";
import { isConnected, uploadBackup } from "@/lib/googleDrive";

const CLIENTS_KEY = "manicure_clients_v1";
const APPTS_KEY = "manicure_appointments_v1";

function buildBackupJson(): string {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    clients: JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]"),
    appointments: JSON.parse(localStorage.getItem(APPTS_KEY) || "[]"),
  });
}

export function useGoogleDriveAutoBackup() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doBackup = useCallback(async () => {
    if (!isConnected()) return;
    const data = buildBackupJson();
    await uploadBackup(data);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doBackup, 2000);
    };

    window.addEventListener("manicure:update", handler);
    return () => {
      window.removeEventListener("manicure:update", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doBackup]);
}
