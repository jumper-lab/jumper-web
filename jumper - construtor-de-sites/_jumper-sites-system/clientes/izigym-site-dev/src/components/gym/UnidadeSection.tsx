import React from "react";
import { ArrowRight } from "lucide-react";

export const UnidadeSection = () => {
  return (
    <section
      id="unidade"
      aria-labelledby="home-campaign-title"
      className="w-full bg-[#201a17] pt-16 md:pt-20"
    >
      <div className="relative isolate overflow-hidden lg:min-h-[39.0625vw]">
        <img
          src="/images/home-campanha-janeiro-2027.webp"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[38%_center] lg:object-center"
          width={1920}
          height={750}
          fetchPriority="high"
        />
        <div className="px-6 py-10 text-white sm:px-10 lg:px-[5.2%] lg:py-[4%]">
          <p className="text-2xl font-light leading-[1.2] lg:text-[2.15vw]">
            Comece agora!
          </p>
          <h1
            id="home-campaign-title"
            className="mt-6 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.025em] sm:text-6xl lg:mt-[1.1vw] lg:text-[5.83vw] lg:leading-none"
          >
            <span className="block">1ª Mensalidade só</span>
            <span className="block text-[#ff5000]">em janeiro de 2027.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base font-light leading-[1.2] sm:text-xl lg:mt-[1.6vw] lg:max-w-none lg:text-[1.3vw] lg:leading-[1.1]">
            Matricule-se durante o período promocional
            <br className="hidden sm:block" /> e comece a treinar ainda em 2026.
          </p>
          <a
            href="#planos"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#ff5000] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#d94300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base lg:mt-[2vw] lg:min-h-[3.35vw] lg:gap-[0.6vw] lg:px-[1.05vw] lg:py-[0.7vw] lg:text-[1.1vw]"
          >
            Matricule-se agora
            <ArrowRight
              aria-hidden="true"
              className="h-6 w-6 lg:h-[1.6vw] lg:w-[1.6vw]"
            />
          </a>
          <div className="mt-8 max-w-lg text-xs font-light leading-snug lg:mt-[2.1vw] lg:max-w-none lg:text-[max(11px,0.65vw)] lg:leading-[1.15]">
            <p>
              Oferta válida até 30/11/2026, conforme condições e planos
              participantes da campanha.
              <br />
              Consulte o regulamento na unidade ou{" "}
              <a
                href="#contato"
                className="underline underline-offset-2 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                clique aqui.
              </a>
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
