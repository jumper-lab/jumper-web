import content from '../../data/content.json';
import manifest from '../../public/images/manifest.json';
import selections from '../../data/photo-selections.json';

export { content };
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (route = '/') => `${base}${route.startsWith('/') ? route : `/${route}`}`;
export const imageData = (name: string) => {
  const variants = manifest.filter((entry) => entry.file.startsWith(`${name}-`));
  if (!variants.length) throw new Error(`Imagem não encontrada: ${name}`);
  const chosen = variants.find((entry) => entry.file === `${name}-1100.webp`) || variants[0];
  const smallest = new Map<number, (typeof variants)[number]>();
  variants.forEach(entry => {
    const existing = smallest.get(entry.width);
    if (!existing || entry.bytes < existing.bytes) smallest.set(entry.width,entry);
  });
  const unique = [...smallest.values()].sort((a,b) => a.width-b.width);
  return {
    src: href(`/images/${chosen.file}`), width: chosen.width, height: chosen.height,
    srcset: unique.map((entry) => `${href(`/images/${entry.file}`)} ${entry.width}w`).join(', '),
    full: href(`/images/${variants[variants.length-1].file}`),
    alt: (selections as Record<string,{alt:string}>)[name]?.alt || ''
  };
};
export const price = (amount: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(amount);
