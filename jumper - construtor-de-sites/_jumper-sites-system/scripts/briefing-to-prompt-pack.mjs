#!/usr/bin/env node
/**
 * Converte exportacoes tabulares do briefing em pacotes prontos para IA.
 *
 * Este script automatiza apenas CSV/TSV. PDFs, DOCX, textos, prints e outros
 * formatos continuam aceitos pelo fluxo do sistema, mas devem ser normalizados
 * manualmente/por IA antes de virar prompt pack.
 *
 * Uso:
 *   node scripts/briefing-to-prompt-pack.mjs caminho/arquivo-do-briefing
 *   node scripts/briefing-to-prompt-pack.mjs caminho/arquivo-do-briefing --out _jumper-sites-system/clientes
 *
 * A saida sempre fica organizada por cliente:
 *   clientes/[slug]/briefing/entrada/
 *   clientes/[slug]/briefing/briefing-normalizado.md
 *   clientes/[slug]/briefing/prompt-*.md
 *   incluindo um unico prompt operacional para construir o site do cliente
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_ROOT = resolve(__dirname, '..');
const DEFAULT_OUT = join(SYSTEM_ROOT, 'clientes');
const BUILD_PROMPT = join(SYSTEM_ROOT, '_cofre-jumper', 'prompts', 'build-client-site.prompt.md');

const args = process.argv.slice(2);
const briefingPath = args.find((arg) => !arg.startsWith('--'));
const outFlagIndex = args.indexOf('--out');
const outRoot = outFlagIndex >= 0 && args[outFlagIndex + 1]
  ? resolve(args[outFlagIndex + 1])
  : DEFAULT_OUT;

if (!briefingPath) {
  console.error('Uso: node scripts/briefing-to-prompt-pack.mjs caminho/arquivo-do-briefing [--out pasta-clientes]');
  process.exit(1);
}

const inputPath = resolve(briefingPath);
if (!existsSync(inputPath)) {
  console.error(`Arquivo de briefing nao encontrado: ${inputPath}`);
  process.exit(1);
}

const stripBom = (value) => value.replace(/^\uFEFF/, '');
const tallyTableExtension = '.csv';
const supportedTableExtensions = new Set([tallyTableExtension, '.tsv']);

const getBriefingSource = (filePath) => {
  const extension = extname(filePath).toLowerCase();
  const rawName = basename(filePath, extension);
  const kindByExtension = new Map([
    [tallyTableExtension, 'arquivo tabular do Tally (CSV)'],
    ['.tsv', 'arquivo tabular do Tally (TSV)'],
    ['.pdf', 'arquivo PDF - normalizacao manual necessaria'],
    ['.doc', 'documento do cliente - normalizacao manual necessaria'],
    ['.docx', 'documento do cliente - normalizacao manual necessaria'],
    ['.txt', 'briefing em texto - normalizacao manual necessaria'],
    ['.md', 'briefing em texto - normalizacao manual necessaria'],
  ]);
  const kind = kindByExtension.get(extension) ?? 'arquivo de briefing';

  return {
    name: rawName,
    extension,
    kind,
    label: `${rawName} (${kind})`,
    isAutomatedTable: supportedTableExtensions.has(extension),
  };
};

const briefingSource = getBriefingSource(inputPath);

if (!briefingSource.isAutomatedTable) {
  console.error([
    `O script automatizado aceita apenas arquivos tabulares CSV/TSV do Tally: ${inputPath}`,
    '',
    'Este formato continua aceito pelo fluxo do sistema, mas precisa ser normalizado manualmente/por IA.',
    'Crie um briefing-normalizado.md equivalente e use os prompts oficiais para seguir o processo.',
  ].join('\n'));
  process.exit(1);
}

const countDelimiterOutsideQuotes = (line, delimiter) => {
  let count = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) count += 1;
  }

  return count;
};

const detectDelimiter = (text, extension) => {
  if (extension === '.tsv') return '\t';

  const firstLine = text
    .split(/\r?\n/)
    .find((line) => line.trim());
  if (!firstLine) return ',';

  const candidates = [',', ';', '\t'];
  return candidates
    .map((delimiter) => ({
      delimiter,
      count: countDelimiterOutsideQuotes(firstLine, delimiter),
    }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
};

const parseDelimitedTable = (text, delimiter) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
};

const slugify = (value) => String(value || 'cliente')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'cliente';

const normalizeKey = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const firstValueByHints = (entry, hints) => {
  const normalizedHints = hints.map(normalizeKey).filter(Boolean);
  const answersWithValue = entry.answers
    .filter(({ value }) => value)
    .map((answer) => ({
      ...answer,
      normalizedKey: normalizeKey(answer.key),
    }));

  const findBy = (matcher) => {
    for (const hint of normalizedHints) {
      const found = answersWithValue.find(({ normalizedKey }) => matcher(normalizedKey, hint));
      if (found) return found.value;
    }
    return null;
  };

  return findBy((normalizedKey, hint) => normalizedKey === hint)
    ?? findBy((normalizedKey, hint) => normalizedKey.startsWith(`${hint} `))
    ?? findBy((normalizedKey, hint) => normalizedKey.includes(hint));
};

const MODEL_CONFIRMATION_FIELDS = [
  { model: 'M5', label: 'Confirmo que este briefing é para Reformulação de Site Institucional Local' },
  {
    model: 'M1',
    label: 'Confirmo que este briefing é para Site One Page',
  },
  {
    model: 'M2',
    label: 'Confirmo que este briefing é para Site com Duas Páginas',
  },
  {
    model: 'M3',
    label: 'Confirmo que este briefing é para Portfólio ou Catálogo',
  },
  {
    model: 'M4',
    label: 'Confirmo que este briefing é para Site Completo Local',
  },
];

const isCheckedValue = (value) => {
  const normalized = normalizeKey(value);
  if (!normalized) return false;

  return ![
    '0',
    'false',
    'nao',
    'no',
    'unchecked',
    'desmarcado',
    'n',
  ].includes(normalized);
};

const detectModel = (value) => {
  const normalized = normalizeKey(value);
  if (/\bm5\b/.test(normalized) || normalized.includes('reformulacao')) return 'M5';
  if (normalized.includes('m1') || normalized.includes('one page')) return 'M1';
  if (normalized.includes('m2') || normalized.includes('duas')) return 'M2';
  if (normalized.includes('m3') || normalized.includes('portfolio') || normalized.includes('catalogo')) return 'M3';
  if (normalized.includes('m4') || normalized.includes('completo')) return 'M4';
  return null;
};

const detectModelFromConfirmation = (entry) => {
  const checkedConfirmations = MODEL_CONFIRMATION_FIELDS.filter(({ label }) => {
    const normalizedLabel = normalizeKey(label);
    return entry.answers.some(({ key, value }) => (
      normalizeKey(key) === normalizedLabel && isCheckedValue(value)
    ));
  });

  return checkedConfirmations.length === 1 ? checkedConfirmations[0].model : null;
};

const detectModelForEntry = (entry) => {
  const selectedModel = detectModel(firstValueByHints(entry, [
    'modelo contratado',
    'modelo do site',
    'modelo',
  ]) || '');

  if (selectedModel) {
    return {
      model: selectedModel,
      source: 'campo Modelo contratado',
    };
  }

  const confirmedModel = detectModelFromConfirmation(entry);
  if (confirmedModel) {
    return {
      model: confirmedModel,
      source: 'confirmacao obrigatoria do formulario',
    };
  }

  return {
    model: null,
    source: null,
  };
};

const detectSecondaryPage = (value) => {
  const normalized = normalizeKey(value);
  if (normalized.includes('sobre')) return 'sobre';
  if (normalized.includes('servico')) return 'servicos';
  if (normalized.includes('depoimento')) return 'depoimentos';
  if (normalized.includes('galeria') || normalized.includes('portfolio')) return 'galeria';
  if (normalized.includes('contato')) return 'contato';
  return null;
};

const detectPersonalityFolder = (value) => {
  const normalized = normalizeKey(value);
  if (normalized.includes('acolhedor') || normalized.includes('familiar')) return '_referencias-visuais/01-acolhedor-familiar';
  if (normalized.includes('premium') || normalized.includes('sofisticado')) return '_referencias-visuais/02-premium-sofisticado';
  if (normalized.includes('energetico') || normalized.includes('vibrante')) return '_referencias-visuais/03-energetico-vibrante';
  if (normalized.includes('tecnico') || normalized.includes('confiavel')) return '_referencias-visuais/04-tecnico-confiavel';
  if (normalized.includes('artesanal') || normalized.includes('autentico')) return '_referencias-visuais/05-artesanal-autentico';
  if (normalized.includes('moderno') || normalized.includes('descolado')) return '_referencias-visuais/06-moderno-descolado';
  return null;
};

const formatBriefing = (entry, meta) => {
  const lines = [
    '# Briefing normalizado do cliente',
    '',
    `Origem do briefing: ${briefingSource.label}`,
    `Registro do briefing: ${entry.rowNumber}`,
    `Cliente detectado: ${meta.clientName}`,
    `Slug sugerido: ${meta.slug}`,
    `Modelo detectado: ${meta.model ?? 'nao detectado'}`,
    `Fonte do modelo detectado: ${meta.modelDetectionSource ?? 'nao detectada'}`,
    `Pagina secundaria detectada: ${meta.secondaryPage ?? 'nao detectada'}`,
    '',
    '## Respostas',
    '',
  ];

  entry.answers.forEach(({ key, value }) => {
    if (!value) return;
    lines.push(`### ${key}`);
    lines.push('');
    lines.push(value);
    lines.push('');
  });

  return lines.join('\n').trim() + '\n';
};

const toEntry = (headers, row, rowIndex) => {
  const answers = headers.map((header, index) => ({
    key: stripBom(header).trim(),
    value: String(row[index] ?? '').trim(),
  })).filter(({ key }) => key);

  return {
    rowNumber: rowIndex + 2,
    answers,
  };
};

const text = readFileSync(inputPath, 'utf8');
const delimiter = detectDelimiter(text, briefingSource.extension);
const rows = parseDelimitedTable(text, delimiter);

if (rows.length < 2) {
  console.error('Arquivo de briefing sem respostas tabulares. Preciso de cabecalho e pelo menos uma linha.');
  process.exit(1);
}

const [headers, ...submissionRows] = rows;
if (headers.length < 2) {
  console.error([
    'Arquivo tabular com apenas uma coluna detectada.',
    'Verifique se o arquivo foi exportado corretamente ou se o separador e CSV/TSV valido.',
  ].join('\n'));
  process.exit(1);
}
const buildPrompt = readFileSync(BUILD_PROMPT, 'utf8').trim();

mkdirSync(outRoot, { recursive: true });

const usedSlugs = new Map();

const generated = submissionRows.map((row, index) => {
  const entry = toEntry(headers, row, index);
  const clientName = firstValueByHints(entry, [
    'nome do negocio',
    'nome da empresa',
    'nome da marca',
    'nome fantasia',
  ]) || `cliente-${index + 1}`;
  const modelDetection = detectModelForEntry(entry);
  const model = modelDetection.model;
  const secondaryPage = detectSecondaryPage(firstValueByHints(entry, ['segunda pagina', 'pagina secundaria']) || '');
  const personalityFolder = detectPersonalityFolder(firstValueByHints(entry, [
    'personalidade que mais representa',
    'personalidade visual',
    'personalidade',
  ]) || '');
  const baseSlug = slugify(clientName);
  const previousUses = usedSlugs.get(baseSlug) ?? 0;
  usedSlugs.set(baseSlug, previousUses + 1);
  const slug = previousUses === 0 ? baseSlug : `${baseSlug}-${previousUses + 1}`;
  const folder = join(outRoot, slug, 'briefing');

  const entryFolder = join(folder, 'entrada');
  mkdirSync(entryFolder, { recursive: true });
  copyFileSync(inputPath, join(entryFolder, basename(inputPath)));

  const meta = {
    source_briefing: briefingSource.label,
    source_briefing_name: briefingSource.name,
    source_briefing_kind: briefingSource.kind,
    source_delimiter: delimiter === '\t' ? 'tab' : delimiter,
    source_record: entry.rowNumber,
    clientName,
    slug,
    model,
    modelDetectionSource: modelDetection.source,
    secondaryPage: model === 'M2' ? (secondaryPage ?? null) : null,
    reformulation: model === "M5" ? {
      existing_site_url: firstValueByHints(entry, ["site atual m5", "url do site atual", "site atual"]),
      scope_status: "pending_review",
    } : null,
    personalityBaseDesignSystemsFolder: personalityFolder,
    needs_review: {
      model: model === null,
      reformulationScope: model === 'M5',
      secondaryPage: model === 'M2' && secondaryPage === null,
      personality: personalityFolder === null,
    },
    generated_at: new Date().toISOString(),
  };
  const briefing = formatBriefing(entry, meta);

  writeFileSync(join(folder, 'briefing-normalizado.md'), briefing);
  writeFileSync(join(folder, 'prompt-build-client-site.md'), [
    '# Prompt pronto — Construir site autoral do cliente',
    '',
    `SLUG_DO_CLIENTE: ${slug}`,
    `PASTA_DSS_BASE_PERSONALIDADE: ${personalityFolder ?? '[PREENCHER — personalidade nao detectada]'}`,
    '',
    'Use este arquivo como prompt unico do cliente. Ele deve criar ou revisar:',
    '',
    `- _jumper-sites-system/clientes/${slug}/data/design-system.json`,
    `- _jumper-sites-system/clientes/${slug}/data/content.json`,
    `- _jumper-sites-system/clientes/${slug}/jumper.config.json`,
    `- _jumper-sites-system/clientes/${slug}/data/final-design-system.json`,
    `- _jumper-sites-system/clientes/${slug}/data/final-site-build-prompt.md`,
    `- _jumper-sites-system/clientes/${slug}/src/`,
    `- _jumper-sites-system/clientes/${slug}/data/visual-quality-audit.json`,
    `- _jumper-sites-system/clientes/${slug}/data/design-system-previews/final-design-system-preview.md`,
    `- _jumper-sites-system/clientes/${slug}/README.md`,
    '',
    'Briefing normalizado:',
    '',
    briefing,
    '',
    '---',
    '',
    buildPrompt,
    '',
  ].join('\n'));
  writeFileSync(join(folder, 'metadata.json'), JSON.stringify(meta, null, 2) + '\n');
  writeFileSync(join(folder, 'jumper-config-sugerido.json'), JSON.stringify({
    schema_version: '1.0.0',
    client: {
      slug,
      name: clientName,
      segment: firstValueByHints(entry, ['segmento principal', 'segmento']) ?? null,
      city: firstValueByHints(entry, ['cidade', 'cidade bairros', 'cidade de atuacao']) ?? null,
      primary_domain: 'site.jumper.dev.br',
      development_url: `https://site.jumper.dev.br/${slug}/`,
      official_url: null,
    },
    site: {
      engine: 'ds-autoral',
      model: meta.model,
      ...(meta.model === "M5" ? { reformulation: meta.reformulation } : {}),
      secondary_page: meta.secondaryPage,
      hosting: 'cloudflare-workers-static-assets',
      base_path: `/${slug}`,
      hub: {
        worker: 'jumper-hoster',
        single_worker_policy: true,
        standalone_client_worker_allowed: false,
        registry: 'jumper-hoster.registry.json',
        dashboard_url: 'https://site.jumper.dev.br/',
        registration_required: true,
        group_versions_by_client: true,
        official_url_required_when_available: true,
        client_route_requires_password: false,
      },
    },
  }, null, 2) + '\n');

  return { folder, meta };
});

console.log(`\nGerados ${generated.length} pacote(s) de briefing em: ${outRoot}/[slug]/briefing\n`);
generated.forEach(({ folder, meta }) => {
  const modelLabel = meta.model ?? 'modelo nao detectado';
  const personalityLabel = meta.personalityBaseDesignSystemsFolder ?? 'personalidade nao detectada';
  console.log(`- ${meta.clientName} (${modelLabel})`);
  console.log(`  ${folder}`);
  if (meta.needs_review.model || meta.needs_review.secondaryPage || meta.needs_review.personality || meta.needs_review.reformulationScope) {
    console.log(`  Revisar antes de criar cliente: ${JSON.stringify(meta.needs_review)}`);
    console.log(`  Personalidade: ${personalityLabel}`);
  }
});
