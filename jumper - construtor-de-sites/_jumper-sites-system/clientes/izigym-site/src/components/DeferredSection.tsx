import React from "react";

interface DeferredSectionProps {
  children: React.ReactNode;
  id?: string;
  minHeight?: number;
}

export const DeferredSection = ({ children, id, minHeight = 1 }: DeferredSectionProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    const loadForNavigation = () => {
      setShouldRender(true);
      observer.disconnect();
    };
    element.addEventListener("izi:load-section", loadForNavigation);
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.removeEventListener("izi:load-section", loadForNavigation);
    };
  }, []);

  return (
    <div id={id} ref={ref} data-deferred-section className="scroll-mt-16 md:scroll-mt-20" style={!shouldRender ? { minHeight } : undefined}>
      {shouldRender ? children : null}
    </div>
  );
};
