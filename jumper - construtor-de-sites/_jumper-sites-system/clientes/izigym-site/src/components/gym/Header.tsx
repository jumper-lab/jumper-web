import React from "react";
import { MobileNav } from "./MobileNav";

export const Header = () => {
  const [glassProgress, setGlassProgress] = React.useState(0);

  React.useEffect(() => {
    const updateHeaderState = () => {
      const headerHeight = window.innerWidth >= 768 ? 80 : 64;
      const heroElement = document.getElementById("unidade");

      if (!heroElement) {
        setGlassProgress(1);
        return;
      }

      const heroHeight = Math.max(heroElement.offsetHeight, window.innerHeight);
      const progressDistance = Math.max(heroHeight - headerHeight, 1);
      const nextProgress = Math.min(Math.max(window.scrollY / progressDistance, 0), 1);

      setGlassProgress(nextProgress);
    };

    const handleScroll = () => {
      updateHeaderState();
      window.requestAnimationFrame(updateHeaderState);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleSmoothScroll = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const navClassName =
    "fixed top-0 w-full z-50 text-white transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-soft";

  const navStyle = {
    backgroundColor: `rgba(8, 8, 8, ${0.6 * glassProgress})`,
    backdropFilter: `blur(${40 * glassProgress}px) saturate(${1 + 0.5 * glassProgress})`,
    WebkitBackdropFilter: `blur(${40 * glassProgress}px) saturate(${1 + 0.5 * glassProgress})`,
    boxShadow: `0 18px 45px rgba(0, 0, 0, ${0.22 * glassProgress})`,
  };

  const linkClassName =
    "relative inline-flex h-10 items-center text-white drop-shadow-sm transition-all duration-500 ease-soft hover:-translate-y-0.5 hover:text-white/75 after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-5 after:-translate-x-1/2 after:translate-y-1 after:bg-white after:opacity-0 after:transition-all after:duration-500 after:ease-soft hover:after:translate-y-0 hover:after:opacity-100";

  return (
    <nav className={navClassName} style={navStyle}>
      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 h-16 md:h-20 flex items-center justify-between md:justify-start md:gap-16 lg:gap-20">
        <div className="nav-logo-intro h-full flex items-center">
          <img
            src="/brand/izi-logo-tight.png"
            alt="IZI ONE Logo"
            className="h-5 md:h-9 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all duration-700 ease-soft"
          />
        </div>

        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-light uppercase tracking-[0.18em] leading-none">
          <a className={`${linkClassName} nav-item-intro`} style={{ animationDelay: "260ms" }} href="#unidade" onClick={(e) => handleSmoothScroll(e, "unidade")}>
            HOME
          </a>
          <a className={`${linkClassName} nav-item-intro`} style={{ animationDelay: "330ms" }} href="#planos" onClick={(e) => handleSmoothScroll(e, "planos")}>
            PLANOS
          </a>
          <a className={`${linkClassName} nav-item-intro`} style={{ animationDelay: "400ms" }} href="#pass" onClick={(e) => handleSmoothScroll(e, "pass")}>
            UNIDADE
          </a>
          <a className={`${linkClassName} nav-item-intro`} style={{ animationDelay: "470ms" }} href="#galeria" onClick={(e) => handleSmoothScroll(e, "galeria")}>
            INTERIOR
          </a>
          <a className={`${linkClassName} nav-item-intro`} style={{ animationDelay: "540ms" }} href="#faq" onClick={(e) => handleSmoothScroll(e, "faq")}>
            FAQ
          </a>
          <a className={`${linkClassName} nav-item-intro`} style={{ animationDelay: "610ms" }} href="#contato" onClick={(e) => handleSmoothScroll(e, "contato")}>
            CONTATO
          </a>
        </div>

        <div className="md:hidden">
          <MobileNav handleSmoothScroll={handleSmoothScroll} isHeaderScrolled={false} />
        </div>
      </div>

      <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2">
        <a
          href="#planos"
          onClick={(e) => handleSmoothScroll(e, "planos")}
          className="nav-cta-intro inline-flex h-11 items-center justify-center rounded-full border border-primary bg-primary px-7 text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_rgba(229,44,18,0.16)] transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-primary/30 hover:shadow-none"
        >
          Matricule-se
        </a>
      </div>
    </nav>
  );
};
