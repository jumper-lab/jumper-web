import React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { cloudflareImage, cloudflareImageSrcSet } from "@/lib/cloudflare-image";

export const UnidadeSection = () => {
  const imgSrc = "/images/hero-izigym.jpg";

  return (
    <section
      id="unidade"
      className="relative w-full max-w-full h-[100svh] bg-section-gray overflow-hidden"
    >
      <div className="relative w-full h-full">
        <img
          alt="Espaço amplo e bem iluminado da IZI ONE"
          className="hero-bg-intro w-full h-full block object-cover object-center"
          src={cloudflareImage(imgSrc, 1280)}
          srcSet={cloudflareImageSrcSet(imgSrc, [640, 960, 1280, 1600, 1920])}
          sizes="100vw"
          width={2400}
          height={1800}
          fetchPriority="high"
        />
        {/* Overlay com opacidade de 60% */}
        <div className="hero-scrim-intro absolute inset-0 bg-black/60 pointer-events-none" />
        <div className="hero-scrim-intro absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/65 to-transparent pointer-events-none" />
        <div className="hero-scrim-intro pointer-events-none absolute bottom-0 left-0 h-[58%] w-[72%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.5)_34%,rgba(0,0,0,0.18)_62%,transparent_78%)]" />

        <div className="absolute inset-0 z-10 overflow-visible">
          <div className="max-w-7xl mx-auto px-6 flex h-full items-end pb-36 pt-20 sm:items-center sm:pb-0">
            <div className="w-full sm:translate-y-16 md:translate-y-20">
              <div className="w-full max-w-3xl text-left text-white">
                <span className="hero-copy-intro hero-delay-1 block text-[11px] sm:text-sm font-bold uppercase tracking-[0.22em] text-primary mb-3 sm:mb-4">
                  Um novo conceito
                  <br />
                  de academia
                </span>
                <h1 className="hero-copy-intro hero-delay-2 text-[3.35rem] xs:text-6xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tight">
                  IZI GYM
                </h1>
                <p className="hero-copy-intro hero-delay-3 mt-5 max-w-2xl text-base xs:text-lg sm:text-xl md:text-2xl text-zinc-100 leading-relaxed">
                  Treine com liberdade, conforto e energia em um espaço completo para transformar constância em resultado.
                </p>
                <div className="hero-copy-intro hero-delay-4 mt-7 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 overflow-visible py-1">
                  <a
                    href="#planos"
                    className="group/primary relative inline-flex h-11 w-full xs:w-auto items-center justify-center gap-2 rounded-full border border-primary bg-primary px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_22px_rgba(229,44,18,0.18)] transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-primary/30 hover:shadow-none focus:outline-none focus:ring-4 focus:ring-primary/30"
                  >
                    <span className="relative">Conheça os planos</span>
                    <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-500 ease-soft group-hover/primary:translate-x-0.5" />
                  </a>
                  <a
                    href="#pass"
                    className="group/secondary relative inline-flex h-11 w-full xs:w-auto items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.045] px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md transition-all duration-500 ease-soft hover:-translate-y-px hover:border-white/55 hover:bg-white/[0.10] hover:shadow-[0_14px_38px_rgba(255,255,255,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25"
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/16 to-white/0 opacity-0 transition-all duration-700 ease-soft group-hover/secondary:opacity-100" />
                    <span className="pointer-events-none absolute inset-px rounded-full ring-1 ring-inset ring-white/0 transition-all duration-500 ease-soft group-hover/secondary:ring-white/15" />
                    <span className="relative">Unidade Alto Pinheiros</span>
                    <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-500 ease-soft group-hover/secondary:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <a
            href="#planos"
            aria-label="Ir para os planos"
            className="hero-copy-intro hero-delay-4 absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center justify-center text-white/75 transition-colors duration-500 ease-soft hover:text-white motion-safe:animate-[hero-arrow-float_1.8s_ease-in-out_infinite] sm:flex"
          >
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
