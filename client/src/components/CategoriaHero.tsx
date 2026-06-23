import { Briefcase, Sparkles, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIAS_HERO, CATEGORIA_HERO_META } from "@/lib/domain";

// Mapa de ícones por nome
const ICON_MAP = {
  Stethoscope,
  Sparkles,
  Briefcase,
} as const;

type IconName = keyof typeof ICON_MAP;

interface CategoriaHeroBadgeProps {
  categoria: string;
  size?: "sm" | "md";
  className?: string;
}

/** Badge compacta exibida nos cards da lista e da agenda. */
export function CategoriaHeroBadge({ categoria, size = "sm", className }: CategoriaHeroBadgeProps) {
  const meta = CATEGORIA_HERO_META[categoria];
  if (!meta) return null;
  const Icon = ICON_MAP[meta.icon as IconName];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold border",
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs",
        "bg-amber-50 border-amber-300 text-amber-700",
        className,
      )}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {meta.short}
    </span>
  );
}

interface CategoriaHeroSelectorProps {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}

/** Seletor de 3 ícones/categorias exibido na ficha do conteúdo. */
export function CategoriaHeroSelector({ value, onChange, disabled }: CategoriaHeroSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Categoria Hero
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS_HERO.map((cat) => {
          const meta = CATEGORIA_HERO_META[cat];
          const Icon = ICON_MAP[meta.icon as IconName];
          const isSelected = value === cat;
          return (
            <button
              key={cat}
              type="button"
              disabled={disabled}
              onClick={() => onChange(isSelected ? null : cat)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-3 transition-all duration-150 cursor-pointer select-none",
                "hover:shadow-md active:scale-95",
                isSelected
                  ? "border-amber-400 bg-amber-50 shadow-amber-100 shadow-md"
                  : "border-border bg-white hover:border-amber-300 hover:bg-amber-50/40",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              title={isSelected ? `Remover: ${cat}` : `Classificar como: ${cat}`}
            >
              <div
                className={cn(
                  "rounded-full p-2",
                  isSelected ? "bg-amber-100" : "bg-slate-100",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isSelected ? "text-amber-600" : "text-slate-500",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold text-center leading-tight max-w-[80px]",
                  isSelected ? "text-amber-700" : "text-slate-600",
                )}
              >
                {meta.label}
              </span>
              {isSelected && (
                <span className="text-[9px] text-amber-500 font-bold tracking-wide">
                  ✓ SELECIONADO
                </span>
              )}
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-xs text-amber-600 font-medium">
          ★ Este conteúdo será destacado em dourado na lista e na agenda.
        </p>
      )}
    </div>
  );
}
