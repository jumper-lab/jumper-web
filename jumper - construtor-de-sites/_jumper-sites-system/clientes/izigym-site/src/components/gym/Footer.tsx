import React from "react";
import { ArrowUpRight, Clock, Instagram, MapPin, Phone } from "lucide-react";
import { ScrollToTopLink } from "./ScrollToTopLink";

export const Footer = () => {
  return (
    <footer className="px-5 sm:px-6 pb-32 pt-16 md:pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 lg:gap-14 lg:grid-cols-[1fr_1.35fr] lg:items-end">
          <div className="max-w-2xl">
            <img
              src="/brand/izi-gym-footer.webp"
              alt="IZI GYM Logo"
              className="h-20 w-auto sm:h-24"
            />
            <p className="mt-7 sm:mt-8 max-w-xl text-4xl font-bold leading-tight tracking-tight text-zinc-900 md:text-6xl">
              Treine em Alto de Pinheiros.
            </p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-500">
              Estrutura completa, rotina simples e uma experiência pensada para você manter constância.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="tel:+5511952137022"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors duration-500 ease-soft hover:border-zinc-900 hover:text-zinc-900"
              >
                <Phone className="h-4 w-4" />
                11 95213-7022
              </a>
              <a
                href="https://www.instagram.com/izigym.brasil/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors duration-500 ease-soft hover:border-zinc-900 hover:text-zinc-900"
              >
                <Instagram className="h-4 w-4" />
                @izigym.brasil
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:gap-10">
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-900">
                Endereço
              </h4>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Rua%20Cerro%20Cor%C3%A1%2C%202235%2C%20Alto%20de%20Pinheiros%2C%20S%C3%A3o%20Paulo%2C%20SP"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 text-sm leading-relaxed text-zinc-500 transition-colors duration-500 ease-soft hover:text-zinc-900"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  R. Cerro Corá, 2235
                  <br />
                  Alto de Pinheiros - São Paulo - SP
                  <br />
                  02675-031
                </span>
              </a>
            </div>

            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-900">
                Funcionamento
              </h4>
              <div className="flex gap-3 text-sm text-zinc-500">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="space-y-3">
                  <div>
                    <span className="block">Segunda a Sexta</span>
                    <span className="font-medium text-zinc-800">05:00 - 23:00</span>
                  </div>
                  <div>
                    <span className="block">Sábado e Domingo</span>
                    <span className="font-medium text-zinc-800">08:00 - 20:00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 sm:text-right">
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <a
                  href="https://www.instagram.com/izigym.brasil/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-500 ease-soft hover:text-zinc-900"
                >
                  Instagram
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <ScrollToTopLink className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-opacity duration-500 ease-soft hover:opacity-60">
                  Voltar ao topo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </ScrollToTopLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 flex flex-col gap-3 border-t border-zinc-200 pt-7 sm:pt-8 text-[10px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.16em] text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} IZI. Todos os direitos reservados.</p>
          <p>Designed by Jumper Studio® 2026</p>
        </div>
      </div>
    </footer>
  );
};
