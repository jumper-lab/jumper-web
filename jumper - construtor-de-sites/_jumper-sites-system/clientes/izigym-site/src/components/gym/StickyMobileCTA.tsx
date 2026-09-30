import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * CTA fixo no rodapé, visível apenas em mobile (<md / 768px).
 * Reforça conversão em telas pequenas onde o botão "Matricule-se" do
 * Header só aparece dentro do drawer.
 *
 * Usa env(safe-area-inset-bottom) pra respeitar a home indicator do iPhone.
 */
export const StickyMobileCTA: React.FC = () => {
  const whatsappHref = `https://wa.me/5511952137022?text=${encodeURIComponent(
    "Olá! Gostaria de saber mais sobre os planos da IZI Gym.",
  )}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("planos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background-light/96 dark:bg-background-dark/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-4 py-2.5"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Chamada para matrícula"
    >
      <div className="flex items-center gap-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Conversar pelo WhatsApp"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-500 ease-soft hover:border-primary/25 hover:bg-primary/5 focus:outline-none focus:ring-4 focus:ring-primary/20"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
        <a
          href="#planos"
          onClick={handleClick}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(229,44,18,0.18)] transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-primary/30 hover:shadow-none focus:outline-none focus:ring-4 focus:ring-primary/35 xs:text-sm xs:tracking-wide"
        >
          <span className="truncate">Matricule-se agora</span>
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
};
