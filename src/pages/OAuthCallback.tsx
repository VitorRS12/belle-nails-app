import { useEffect } from "react";
import { handleOAuthCallbackPage } from "@/lib/googleDrive";

const OAuthCallback = () => {
  useEffect(() => {
    handleOAuthCallbackPage();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-xl font-display mb-2">Conectando ao Google Drive…</h1>
        <p className="text-sm text-muted-foreground">
          Você pode fechar esta janela se ela não fechar sozinha.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
