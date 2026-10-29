const imageOptions = "format=auto,quality=70,metadata=none";

export const cloudflareImage = (src: string, width: number) =>
  `/cdn-cgi/image/width=${width},${imageOptions}${src}`;

export const cloudflareImageSrcSet = (src: string, widths: number[]) =>
  widths.map((width) => `${cloudflareImage(src, width)} ${width}w`).join(", ");
