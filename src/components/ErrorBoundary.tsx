import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    if (typeof window !== "undefined") window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-6">
          <div className="max-w-md w-full rounded-3xl bg-card border border-border/60 p-8 shadow-elegant text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive inline-flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-2xl">Algo deu errado</h1>
              <p className="text-sm text-muted-foreground">
                Tivemos um problema ao carregar esta tela. Tente novamente.
              </p>
            </div>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground bg-secondary/60 rounded-xl p-3 break-words">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={this.reset} className="w-full bg-gradient-primary shadow-elegant">
              Voltar ao início
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
