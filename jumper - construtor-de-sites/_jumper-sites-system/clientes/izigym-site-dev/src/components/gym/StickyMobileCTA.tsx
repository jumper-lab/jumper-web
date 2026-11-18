import React from "react";
import { ArrowRight } from "lucide-react";
import { scrollToPlans } from "@/lib/scroll-to-plans";

/**
 * CTA fixo no rodapé, visível apenas em mobile (<md / 768px).
 * Reforça conversão em telas pequenas onde o botão "Matricule-se" do
 * Header só aparece dentro do drawer.
 *
 * Usa env(safe-area-inset-bottom) pra respeitar a home indicator do iPhone.
 */
export const StickyMobileCTA: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const heroButton = document.querySelector<HTMLAnchorElement>('#unidade a[href="#planos"]');
    if (!heroButton) return;

    // Reveal only after the hero CTA passes above the viewport, never below it.
    const updateVisibility = () => setIsVisible(heroButton.getBoundingClientRect().bottom <= 0);
    updateVisibility();
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    }, { threshold: 0 });
    observer.observe(heroButton);
    return () => observer.disconnect();
  }, []);

  const whatsappHref = `https://wa.me/5511952137022?text=${encodeURIComponent(
    "Olá! Gostaria de saber mais sobre os planos da IZI Gym.",
  )}`;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0b0b0c]/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-opacity ease-soft motion-reduce:transition-none md:hidden ${isVisible ? "duration-300 opacity-100" : "pointer-events-none duration-0 opacity-0"}`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Chamada para matrícula"
      aria-hidden={!isVisible}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <a
          href="#planos"
          tabIndex={isVisible ? undefined : -1}
          data-navigation="mobile_sticky_plans"
          onClick={scrollToPlans}
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-4 text-xs font-medium uppercase tracking-[0.08em] text-white transition-colors duration-300 ease-soft hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/35 xs:text-sm xs:tracking-[0.1em]"
        >
          <span className="-translate-y-[2px] truncate">Matricule-se agora</span>
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
        </a>
        <a
          href={whatsappHref}
          tabIndex={isVisible ? undefined : -1}
          data-whatsapp="whatsapp_mobile_sticky"
          data-whatsapp-channel="principal_sales"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Conversar pelo WhatsApp"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition-colors duration-300 ease-soft hover:border-white/30 hover:bg-white/[0.14] focus:outline-none focus:ring-4 focus:ring-primary/35"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>
    </div>
  );
};
