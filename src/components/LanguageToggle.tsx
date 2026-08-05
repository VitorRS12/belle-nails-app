import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES } from "@/i18n";

interface LanguageToggleProps {
  className?: string;
  variant?: "icon" | "full";
}

/** Language switcher (Português / English). Persists via localStorage. */
export function LanguageToggle({ className, variant = "icon" }: LanguageToggleProps) {
  const { i18n, t } = useTranslation();
  const current =
    SUPPORTED_LANGUAGES.find((l) => i18n.resolvedLanguage?.startsWith(l.code)) ??
    SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          aria-label={t("language.change", "Alterar idioma")}
          className={cn("rounded-full", className)}
        >
          <Languages className="h-4 w-4" />
          {variant === "full" && (
            <span className="ml-2 text-sm font-medium">{current.label}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 bg-popover z-50">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => void i18n.changeLanguage(lang.code)}
            className={cn(
              "cursor-pointer gap-2",
              current.code === lang.code && "font-semibold text-primary",
            )}
          >
            <span aria-hidden>{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
