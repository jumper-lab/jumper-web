import React from "react";
import { Menu, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
  handleSmoothScroll: (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
  isHeaderScrolled?: boolean;
}

const navItems = [
  { name: "HOME", href: "#unidade" },
  { name: "PLANOS", href: "#planos" },
  { name: "UNIDADE", href: "#pass" },
  { name: "INTERIOR", href: "#galeria" },
  { name: "FAQ", href: "#faq" },
  { name: "CONTATO", href: "#contato" },
];

export const MobileNav: React.FC<MobileNavProps> = ({ handleSmoothScroll, isHeaderScrolled = false }) => {
  const [open, setOpen] = React.useState(false);

  const handleNavigationClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    handleSmoothScroll(e, targetId);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={isHeaderScrolled ? "h-11 w-11 rounded-full text-zinc-900 transition-colors duration-500 ease-soft hover:bg-zinc-100" : "h-11 w-11 rounded-full text-white transition-colors duration-500 ease-soft hover:bg-white/10"}
        >
          <Menu className="!h-6 !w-6" />
          <span className="sr-only">Abrir menu de navegação</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(86vw,360px)] bg-background-light dark:bg-zinc-900 flex flex-col p-0 [&>button]:top-[18px] [&>button]:right-[18px] [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>
            <img
              src="/brand/izi-logo-tight.png"
              alt="IZI ONE Logo"
              className="h-8 w-auto"
            />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegação principal.
          </SheetDescription>
        </SheetHeader>
        <Separator className="bg-zinc-200 dark:bg-zinc-700" />

        <nav className="flex-grow p-5">
          <ul className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={(e) => handleNavigationClick(e, item.href.substring(1))}
                  className="block rounded-xl px-3 py-3 text-sm font-medium uppercase tracking-[0.14em] text-zinc-700 transition-colors duration-500 ease-soft hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-5 border-t border-zinc-200 p-5 dark:border-zinc-700">
          <a
            href="#planos"
            data-navigation="mobile_menu_plans"
            onClick={(e) => handleNavigationClick(e, "planos")}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-primary bg-primary px-6 py-3 text-center text-sm font-medium uppercase tracking-wide text-white shadow-[0_8px_22px_rgba(229,44,18,0.18)] transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-primary/30 hover:shadow-none"
          >
            <span className="-translate-y-[2px]">Matricule-se</span>
          </a>
          <div className="flex items-center justify-center space-x-4">
            <a href="https://www.instagram.com/izigym.brasil" target="_blank" rel="noopener noreferrer" className="text-zinc-500 transition-colors duration-500 ease-soft hover:text-primary">
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
