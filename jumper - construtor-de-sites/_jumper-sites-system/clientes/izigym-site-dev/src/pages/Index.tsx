import { lazy, Suspense } from "react";
import { DeferredSection } from "@/components/DeferredSection";
import { Header } from "@/components/gym/Header";
import { UnidadeSection } from "@/components/gym/UnidadeSection";
import { PlanosSection } from "@/components/gym/PlanosSection";

const LocationsSection = lazy(() => import("@/components/gym/LocationsSection").then(({ LocationsSection }) => ({ default: LocationsSection })));
const GallerySection = lazy(() => import("@/components/gym/GallerySection").then(({ GallerySection }) => ({ default: GallerySection })));
const FAQSection = lazy(() => import("@/components/gym/FAQSection").then(({ FAQSection }) => ({ default: FAQSection })));
const Footer = lazy(() => import("@/components/gym/Footer").then(({ Footer }) => ({ default: Footer })));
const WhatsAppButton = lazy(() => import("@/components/gym/WhatsAppButton").then(({ WhatsAppButton }) => ({ default: WhatsAppButton })));
const StickyMobileCTA = lazy(() => import("@/components/gym/StickyMobileCTA").then(({ StickyMobileCTA }) => ({ default: StickyMobileCTA })));

const Index = () => {
  return (
    <>
      {/* Skip link — invisível até receber foco via tab. WCAG 2.4.1 */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/40"
      >
        Pular para o conteúdo
      </a>

      <Header />
      <main id="conteudo">
        <UnidadeSection />
        <PlanosSection />
        <DeferredSection id="pass" minHeight={520}>
          <Suspense fallback={null}>
            <LocationsSection />
          </Suspense>
        </DeferredSection>
        <DeferredSection id="galeria" minHeight={700}>
          <Suspense fallback={null}>
            <GallerySection />
          </Suspense>
        </DeferredSection>
        <DeferredSection id="faq" minHeight={420}>
          <Suspense fallback={null}>
            <FAQSection />
          </Suspense>
        </DeferredSection>
      </main>
      <DeferredSection id="contato" minHeight={420}>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </DeferredSection>
      <Suspense fallback={null}>
        <WhatsAppButton />
        <StickyMobileCTA />
      </Suspense>
    </>
  );
};

export default Index;
