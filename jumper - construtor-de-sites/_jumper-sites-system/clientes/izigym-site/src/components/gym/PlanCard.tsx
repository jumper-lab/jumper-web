import React from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

interface PlanCardProps {
  title: string;
  description: string;
  price: string;
  priceSuffix: string;
  buttonText: string;
  isFeatured: boolean;
  features: { name: string }[];
  urlSale: string;
  isPromo?: boolean;
  originalPrice?: string;
  promoLabel?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  title,
  description,
  price,
  priceSuffix,
  buttonText,
  isFeatured,
  features,
  urlSale,
  isPromo = false,
  originalPrice,
  promoLabel,
}) => {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedDescription = description.trim().toLowerCase();
  const shouldShowDescription =
    normalizedDescription.length > 0 && normalizedDescription !== normalizedTitle;

  const planTone = isFeatured
    ? {
        eyebrow: "Experiência completa",
        note: "Mais liberdade para treinar, recuperar e manter sua rotina com consistência.",
      }
    : {
        eyebrow: "Essencial inteligente",
        note: "Tudo o que você precisa para começar bem e evoluir com clareza.",
      };

  return (
    <div
      className={`group relative flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border p-4 sm:rounded-[24px] sm:p-6 transition-all duration-700 ease-soft
      ${
        isFeatured
          ? "bg-[linear-gradient(155deg,#18181b_0%,#111113_52%,#0b0b0c_100%)] border-primary/60 shadow-[0_26px_80px_rgba(229,44,18,0.14)] hover:border-primary/80 hover:shadow-[0_32px_95px_rgba(229,44,18,0.2)]"
          : "bg-[linear-gradient(155deg,#2b2b2f_0%,#232326_58%,#1c1c1f_100%)] border-white/10 shadow-[0_22px_70px_rgba(0,0,0,0.24)] hover:border-white/20 hover:shadow-[0_28px_84px_rgba(0,0,0,0.34)]"
      }
      ${isPromo ? "ring-1 ring-primary/50" : ""}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent opacity-60 transition-opacity duration-700 ease-soft group-hover:opacity-90" />
      <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {isPromo && (
        <div className="absolute right-4 top-4 z-10 sm:right-5 sm:top-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15
                       px-2.5 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em]
                       text-primary shadow-[0_0_28px_rgba(229,44,18,0.18)] backdrop-blur-md"
          >
            <Sparkles className="w-3 h-3" />
            Oferta
          </span>
        </div>
      )}

      <div className="relative mb-4 pr-20 sm:mb-5 sm:pr-24">
        <span className="mb-3 block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.24em] text-zinc-500">
          {planTone.eyebrow}
        </span>
        <h3 className="mb-2 text-[1.45rem] sm:text-2xl font-bold font-display tracking-wide text-white">
          {title}
        </h3>
        {shouldShowDescription && (
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
        )}
      </div>

      <div className="relative mb-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 sm:mb-5 sm:rounded-[22px] sm:p-4">
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="font-display text-[2.85rem] sm:text-5xl font-bold leading-none tracking-tight text-white">
            {price}
          </span>
          <span className="pb-1 text-sm sm:text-base font-medium text-zinc-400">
            {priceSuffix}
          </span>
        </div>
        {isPromo && promoLabel && (
          <span className="mt-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {promoLabel}
          </span>
        )}
        {isPromo && originalPrice && (
          <p className="mt-2 text-sm font-medium text-zinc-400">
            Depois, {originalPrice}/mês.
          </p>
        )}
      </div>

      <div className="mb-4 border-t border-white/10 pt-4 sm:mb-5 sm:pt-5">
        <span className="mb-3 block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.24em] text-zinc-500">
          Incluso no plano
        </span>
        <div className="flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 sm:px-3 transition-colors duration-500 ease-soft group-hover:border-white/15"
            >
              <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-[11px] sm:text-xs font-medium leading-none text-zinc-300">{feature.name}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-auto mb-4 border-t border-white/10 pt-4 text-xs sm:text-sm leading-relaxed text-zinc-400">
        {planTone.note}
      </p>

      <a
        href={urlSale}
        target="_blank"
        rel="noopener noreferrer"
        className={`group/cta relative inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-center text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.17em] transition-all duration-500 ease-soft
          ${
            isFeatured
              ? "border-primary bg-primary text-white shadow-[0_8px_22px_rgba(229,44,18,0.16)] hover:-translate-y-px hover:bg-primary/30 hover:shadow-none"
              : "border-white/15 bg-white/[0.035] text-zinc-100 hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.075] hover:shadow-[0_14px_34px_rgba(255,255,255,0.08)]"
          }`}
      >
        {!isFeatured && (
          <>
            <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/12 to-white/0 opacity-0 transition-all duration-700 ease-soft group-hover/cta:opacity-100" />
            <span className="pointer-events-none absolute inset-px rounded-full ring-1 ring-inset ring-white/0 transition-all duration-500 ease-soft group-hover/cta:ring-white/10" />
          </>
        )}
        <span className="relative">{buttonText}</span>
        <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-500 ease-soft group-hover/cta:translate-x-0.5" />
      </a>
    </div>
  );
};
