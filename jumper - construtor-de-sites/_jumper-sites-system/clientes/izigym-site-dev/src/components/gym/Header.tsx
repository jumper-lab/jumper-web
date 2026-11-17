import React from "react";
import { MobileNav } from "./MobileNav";

export const Header = () => {
  const [isPastHero, setIsPastHero] = React.useState(false);

  React.useEffect(() => {
    const updateHeaderState = () => {
      const hero = document.getElementById("unidade");
      const headerHeight = window.innerWidth >= 768 ? 80 : 64;
      setIsPastHero(
        !hero || hero.getBoundingClientRect().bottom <= headerHeight,
      );
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
    };
  }, []);

  const handleSmoothScroll = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    event.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const navClassName = `fixed top-0 w-full z-50 transition-[background-color,color,box-shadow] duration-300 ease-soft ${
    isPastHero
      ? "bg-white text-zinc-900 shadow-lg"
      : "bg-transparent text-white"
  }`;

  const linkClassName = `relative inline-flex h-10 items-center transition-all duration-300 ease-soft hover:-translate-y-0.5 after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-5 after:-translate-x-1/2 after:translate-y-1 after:opacity-0 after:transition-all after:duration-300 after:ease-soft hover:after:translate-y-0 hover:after:opacity-100 ${
    isPastHero
      ? "text-zinc-900 hover:text-primary after:bg-zinc-900"
      : "text-white drop-shadow-sm hover:text-white/75 after:bg-white"
  }`;

  return (
    <nav className={navClassName}>
      <div className="relative w-full px-6 sm:px-10 lg:px-[5.2%] h-16 md:h-20 flex items-center justify-between gap-5 lg:gap-8">
        <div className="nav-logo-intro h-full shrink-0 flex items-center">
          <img
            src="/brand/izi-logo-tight.png"
            alt="IZI ONE Logo"
            className="h-5 md:h-9 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all duration-700 ease-soft"
          />
        </div>

        <div className="hidden lg:flex items-center gap-4 xl:gap-8 text-xs xl:text-sm font-light uppercase tracking-[0.18em] leading-none">
          <a
            className={`${linkClassName} nav-item-intro`}
            style={{ animationDelay: "260ms" }}
            href="#unidade"
            onClick={(e) => handleSmoothScroll(e, "unidade")}
          >
            HOME
          </a>
          <a
            className={`${linkClassName} nav-item-intro`}
            style={{ animationDelay: "330ms" }}
            href="#planos"
            onClick={(e) => handleSmoothScroll(e, "planos")}
          >
            PLANOS
          </a>
          <a
            className={`${linkClassName} nav-item-intro`}
            style={{ animationDelay: "400ms" }}
            href="#pass"
            onClick={(e) => handleSmoothScroll(e, "pass")}
          >
            UNIDADE
          </a>
          <a
            className={`${linkClassName} nav-item-intro`}
            style={{ animationDelay: "470ms" }}
            href="#galeria"
            onClick={(e) => handleSmoothScroll(e, "galeria")}
          >
            INTERIOR
          </a>
          <a
            className={`${linkClassName} nav-item-intro`}
            style={{ animationDelay: "540ms" }}
            href="#faq"
            onClick={(e) => handleSmoothScroll(e, "faq")}
          >
            FAQ
          </a>
          <a
            className={`${linkClassName} nav-item-intro`}
            style={{ animationDelay: "610ms" }}
            href="#contato"
            onClick={(e) => handleSmoothScroll(e, "contato")}
          >
            CONTATO
          </a>
        </div>

        <div className="lg:hidden">
          <MobileNav
            handleSmoothScroll={handleSmoothScroll}
            isHeaderScrolled={isPastHero}
          />
        </div>

        <div className="hidden lg:flex shrink-0">
          <a
            href="#planos"
            data-navigation="header_plans"
            onClick={(e) => handleSmoothScroll(e, "planos")}
            className="nav-cta-intro inline-flex h-11 items-center justify-center rounded-full border border-primary bg-primary px-7 text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_rgba(229,44,18,0.16)] transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-primary/90 hover:shadow-none"
          >
            Matricule-se
          </a>
        </div>
      </div>
    </nav>
  );
};
