import React from "react";
import { Reveal } from "@/components/Reveal";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { cloudflareImage, cloudflareImageSrcSet } from "@/lib/cloudflare-image";

const TOUR_VIDEO_ID = "4LyI3_2WWg0";

const galleryItems = [
  {
    type: "video",
    src: `https://www.youtube-nocookie.com/embed/${TOUR_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${TOUR_VIDEO_ID}&rel=0&modestbranding=1&playsinline=1&controls=1&enablejsapi=1`,
    title: "Video da IZI GYM Alto de Pinheiros",
    label: "Tour",
  },
  {
    type: "image",
    src: "/images/gallery-01.jpg",
    alt: "Entrada da IZI GYM Alto de Pinheiros",
    label: "Recepção",
  },
  {
    type: "image",
    src: "/images/gallery-02.jpg",
    alt: "Área de musculação da IZI GYM",
    label: "Musculação",
  },
  {
    type: "image",
    src: "/images/gallery-03.jpg",
    alt: "Equipamentos modernos da academia",
    label: "Equipamentos",
  },
  {
    type: "image",
    src: "/images/gallery-04.jpg",
    alt: "Máquina de treino na área de musculação",
    label: "Força",
  },
  {
    type: "image",
    src: "/images/gallery-05.jpg",
    alt: "Espaço interno com equipamentos de treino",
    label: "Ambiente",
  },
  {
    type: "image",
    src: "/images/gallery-06.jpg",
    alt: "Detalhes da estrutura da academia",
    label: "Estrutura",
  },
];

const VideoGalleryItem = ({
  item,
  iframeRef,
}: {
  item: {
    src: string;
    title: string;
    label: string;
  };
  iframeRef: React.RefObject<HTMLIFrameElement>;
}) => {
  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        ref={iframeRef}
        src={item.src}
        title={item.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
};

export const GallerySection = () => {
  const featuredGalleryItems = galleryItems.slice(0, 7);
  const videoIframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isVideoMuted, setIsVideoMuted] = React.useState(true);

  const sendVideoCommand = (func: string, args: unknown[] = []) => {
    videoIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func,
        args,
      }),
      "*",
    );
  };

  const toggleVideoSound = () => {
    if (isVideoMuted) {
      sendVideoCommand("setVolume", [70]);
      sendVideoCommand("unMute");
      sendVideoCommand("playVideo");
      window.setTimeout(() => {
        sendVideoCommand("setVolume", [70]);
        sendVideoCommand("unMute");
        sendVideoCommand("playVideo");
      }, 250);
      setIsVideoMuted(false);
      return;
    }

    sendVideoCommand("mute");
    setIsVideoMuted(true);
  };

  return (
    <>
      <section className="pt-16 lg:pt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl mx-auto mb-10 lg:mb-14 text-center">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.3em] text-zinc-400 mb-4 block">
              Interior
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
              Conheça a estrutura
              <br className="hidden sm:block" />
              {" "}por dentro.
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 mt-5 sm:mt-6 leading-relaxed">
              Ambientes modernos, equipamentos selecionados e uma atmosfera pensada para deixar o treino mais simples de começar e melhor de manter.
            </p>
          </Reveal>
        </div>

        <div className="grid w-full grid-cols-2 lg:grid-cols-[56.25vh_repeat(3,minmax(0,1fr))] lg:grid-rows-2 gap-2 px-2 sm:gap-4 sm:px-4 lg:gap-0 lg:px-0 lg:h-screen lg:min-h-[680px]">
          {featuredGalleryItems.map((item, index) => (
            <Reveal
              key={item.src}
              delay={index * 70}
              className={item.type === "video" ? "col-span-2 lg:col-span-1 lg:row-span-2 lg:h-full" : "lg:h-full"}
            >
              <figure
                className={cn(
                  "group relative overflow-hidden bg-zinc-900 shadow-lg shadow-black/10 lg:rounded-none lg:shadow-none",
                  item.type === "video"
                    ? "aspect-[4/5] rounded-[22px] sm:aspect-[4/3] sm:rounded-2xl lg:h-full lg:aspect-auto lg:rounded-none"
                    : "aspect-[3/4] rounded-[18px] sm:aspect-[4/3] sm:rounded-2xl lg:h-full lg:aspect-auto lg:rounded-none",
                )}
              >
                {item.type === "video" ? (
                  <VideoGalleryItem item={item} iframeRef={videoIframeRef} />
                ) : (
                  <img
                    src={cloudflareImage(item.src, 640)}
                    srcSet={cloudflareImageSrcSet(item.src, [320, 480, 640, 960])}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    width={1200}
                    height={1800}
                    alt={item.alt}
                    className="h-full w-full object-cover transition-transform duration-1000 ease-soft group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-700 ease-soft group-hover:opacity-95" />
                <figcaption className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] sm:px-3 sm:text-[11px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-white backdrop-blur-md">
                    {item.label}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={toggleVideoSound}
        className="fixed bottom-24 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#080808]/60 text-white shadow-[0_14px_36px_rgba(0,0,0,0.22)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-soft hover:-translate-y-px hover:border-primary/45 hover:bg-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/30 md:bottom-16 md:left-8"
        aria-label={isVideoMuted ? "Ativar som do vídeo" : "Silenciar vídeo"}
        title={isVideoMuted ? "Ativar som" : "Silenciar"}
      >
        {isVideoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </>
  );
};
