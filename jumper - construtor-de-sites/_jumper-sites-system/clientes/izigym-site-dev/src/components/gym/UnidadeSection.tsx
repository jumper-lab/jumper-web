import React from "react";
import { ArrowRight } from "lucide-react";
import { scrollToPlans } from "@/lib/scroll-to-plans";

export const UnidadeSection = () => {
  return (
    <section
      id="unidade"
      aria-labelledby="home-campaign-title"
      className="w-full bg-[#201a17]"
    >
      <div className="relative isolate overflow-hidden pt-16 md:pt-20 lg:min-h-[calc(39.0625vw+5rem)]">
        <img
          src="/images/home-campanha-janeiro-2027.webp"
          alt=""
          className="absolute inset-0 -z-10 h-screen w-full object-cover md:h-full object-[38%_center] lg:object-center"
          width={1920}
          height={750}
          fetchPriority="high"
        />
        <div className="max-w-7xl mx-auto px-6 py-10 text-white sm:px-10 lg:px-6 lg:py-[4%]">
          <p className="hero-copy-intro hero-delay-1 text-2xl font-light leading-[1.2] lg:text-[2.15vw]">
            Comece agora!
          </p>
          <h1
            id="home-campaign-title"
            className="mt-6 text-[clamp(1.875rem,9.6vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.015em] sm:tracking-normal sm:text-6xl lg:mt-[1.1vw] lg:text-[5.83vw] lg:leading-none"
          >
            <span className="hero-copy-intro hero-delay-2 block">
              1ª Mensalidade só
            </span>
            <span className="hero-copy-intro hero-delay-3 block text-primary">
              em janeiro de 2027.
            </span>
          </h1>
          <p className="hero-copy-intro hero-delay-4 mt-7 max-w-xl text-base font-light leading-[1.2] sm:text-xl lg:mt-[1.6vw] lg:max-w-none lg:text-[1.3vw] lg:leading-[1.1]">
            Matricule-se durante o período promocional
            <br className="hidden sm:block" /> e comece a treinar ainda em 2026.
          </p>
          <a
            href="#planos"
            onClick={scrollToPlans}
            style={{ animationDelay: "820ms" }}
            className="hero-copy-intro mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 whitespace-nowrap text-xs min-[360px]:text-sm font-medium leading-none sm:leading-none uppercase tracking-wide text-white transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base lg:mt-[2vw] lg:min-h-[3.35vw] lg:gap-[0.6vw] lg:px-[1.05vw] lg:py-[0.7vw] lg:text-[1.1vw]"
          >
            <span className="-translate-y-[2px]">Matricule-se agora</span>
            <ArrowRight
              aria-hidden="true"
              className="h-6 w-6 lg:h-[1.6vw] lg:w-[1.6vw]"
            />
          </a>
          <div
            style={{ animationDelay: "940ms" }}
            className="hero-copy-intro mt-8 max-w-lg text-xs font-light leading-snug lg:mt-[2.1vw] lg:max-w-none lg:text-[max(11px,0.65vw)] lg:leading-[1.15]"
          >
            <p>
              Oferta válida até 30/11/2026, conforme condições e planos
              participantes da campanha.
              <br />
              Consulte o regulamento na unidade
              <br />
              <span className="whitespace-nowrap">
                ou{" "}
              <a
                href="#contato"
                className="underline underline-offset-2 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                clique aqui.
              </a>
              </span>
            </p>
            <p className="mt-4 lg:mt-[0.9vw]">
              As mensalidades de novembro e dezembro serão de apenas{" "}
              <span className="whitespace-nowrap">R$ 0,27.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
