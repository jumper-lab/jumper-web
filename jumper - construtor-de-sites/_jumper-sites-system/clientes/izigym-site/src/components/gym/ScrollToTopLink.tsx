import React from "react";

interface ScrollToTopLinkProps {
  children: React.ReactNode;
  className?: string;
}

const handleSmoothScrollToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

export const ScrollToTopLink: React.FC<ScrollToTopLinkProps> = ({ children, className }) => {
  return (
    <a
      className={className}
      href="#"
      onClick={handleSmoothScrollToTop}
    >
      {children}
    </a>
  );
};