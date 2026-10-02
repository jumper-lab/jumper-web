import fs from 'node:fs/promises';
import path from 'node:path';
const destination = new URL('../briefing/entrada/site-atual/', import.meta.url);
const base = 'https://paodequeijohaddocklobo.com.br';
const assets = {
  'loja-haddock.jpg': '/wp-content/uploads/2025/01/Pao-de-queijo-haddock-lobo.jpeg',
  'loja-iguatemi.jpg': '/wp-content/uploads/2025/10/paodequeijohaddocklobo-iguatemi.jpg',
  'loja-higienopolis.jpg': '/wp-content/uploads/2025/01/Shopping-Patio-Higienopolis.jpeg',
  'loja-sirio.jpg': '/wp-content/uploads/2025/03/f18c1666-d6e1-4593-bcc7-bdbd2795ae5b.jpeg',
  'loja-leblon.jpg': '/wp-content/uploads/2025/01/Shopping-Leblon-Rio.jpeg',
  'historia.jpg': '/wp-content/uploads/2025/02/paodequeijohaddock-sobre.jpg',
  'carrinho.jpg': '/wp-content/uploads/2024/11/carrinho.jpeg',
  'bebidas.jpg': '/wp-content/uploads/2025/03/bebidas.jpeg',
  'smoothies.jpg': '/wp-content/uploads/2024/04/selvs.jpeg'
};
for (const [name, relative] of Object.entries(assets)) {
  if(process.argv.includes('--menu-only')&&!['bebidas.jpg','smoothies.jpg'].includes(name))continue;
  const response = await fetch(base + relative);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(new URL(name, destination), buffer);
  console.log(name, buffer.length);
}
