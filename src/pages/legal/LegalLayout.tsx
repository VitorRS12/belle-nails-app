import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="font-display text-lg">Belle Nails</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>
        <article className="prose prose-sm sm:prose-base max-w-none text-foreground/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:text-muted-foreground [&_a]:underline">
          {children}
        </article>
      </main>
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Belle Nails
      </footer>
    </div>
  );
}
