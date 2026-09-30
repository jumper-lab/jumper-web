import React from "react";
import { MapPin, Check, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { cloudflareImage, cloudflareImageSrcSet } from "@/lib/cloudflare-image";

const locationData = {
  name: "IZI - Alto de Pinheiros",
  address: "R. Cerro Corá, 2235 - Alto de Pinheiros",
  mapLink: "https://www.google.com/maps/search/?api=1&query=Rua%20Cerro%20Cor%C3%A1%2C%202235%2C%20Alto%20de%20Pinheiros%2C%20S%C3%A3o%20Paulo%2C%20SP",
  imageSrc: "/images/unidade-izigym-segunda.jpg",
  benefits: [
    "Musculação e Cardio",
    "Aulas Coletivas",
    "Ambiente Climatizado",
    "Estacionamento Gratuito",
  ],
};

export const LocationsSection = () => {
  return (
    <section className="py-16 px-5 sm:px-6 lg:py-24 max-w-7xl mx-auto">
      <Reveal className="text-center max-w-3xl mx-auto mb-10 lg:mb-16">
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.3em] text-zinc-400 mb-4 block">
          Nossa Unidade
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
          Um espaço completo para o seu bem-estar.
        </h2>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-5 sm:mt-6 leading-relaxed">
          Descubra a IZI ONE Alto de Pinheiros. Oferecemos uma infraestrutura moderna e diversas modalidades para você alcançar seus objetivos.
        </p>
      </Reveal>
      
      <Reveal
        delay={120}
        className="group relative mx-auto max-w-6xl overflow-hidden rounded-[26px] border border-black/5 shadow-[0_22px_60px_rgba(0,0,0,0.14)] transition-shadow duration-700 ease-soft hover:shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:rounded-[32px]"
      >
        <img
          src={cloudflareImage(locationData.imageSrc, 1280)}
          srcSet={cloudflareImageSrcSet(locationData.imageSrc, [640, 960, 1280, 1600])}
          sizes="(max-width: 640px) 100vw, 1200px"
          width={2200}
          height={1650}
          alt={`Unidade ${locationData.name}`}
          className="h-[620px] w-full object-cover transition-transform duration-1000 ease-soft group-hover:scale-[1.025] sm:h-[560px] md:h-[500px]"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/28 to-black/86 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/36 sm:to-black/18" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/42 to-transparent" />
        
        <div className="absolute inset-0 flex items-end p-5 text-white sm:p-8 md:p-10">
          <div className="grid w-full gap-5 sm:gap-7 lg:grid-cols-[1.05fr_1fr_auto] lg:items-end">
            <div className="max-w-xl">
              <span className="mb-3 sm:mb-4 inline-flex rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/75 backdrop-blur-md">
                Alto de Pinheiros
              </span>
              <h3 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                IZI Gym
              </h3>
              <a
                href={locationData.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-start gap-2 text-sm leading-relaxed text-white/72 transition-colors duration-500 ease-soft hover:text-white"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{locationData.address}</span>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-3 min-[440px]:grid-cols-2">
              {locationData.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="inline-flex items-center gap-2.5 text-[12px] font-light leading-snug tracking-[0.01em] text-white/82 sm:text-sm"
                >
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="lg:justify-self-end">
              <a
                href={locationData.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-primary px-7 py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-widest text-white shadow-[0_8px_22px_rgba(229,44,18,0.18)] transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-primary/30 hover:shadow-none focus:ring-4 focus:ring-primary/35 md:w-auto"
              >
                <ExternalLink className="w-4 h-4" />
                Ver no Mapa
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
