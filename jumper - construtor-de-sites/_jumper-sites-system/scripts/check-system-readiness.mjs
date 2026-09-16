#!/usr/bin/env node
import { validateM5Scope } from "./m5-scope.mjs";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const ok = [];
const warnings = [];
const blockers = [];

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function isDir(relativePath) {
  try {
    return fs.statSync(path.join(repoRoot, relativePath)).isDirectory();
  } catch {
    return false;
  }
}

function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return "";
  return fs.readFileSync(absolutePath, "utf8");
}

function listDirs(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function listFiles(relativePath, predicate = () => true) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function listFilesRecursive(relativePath, predicate = () => true) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  const results = [];
  const walk = (currentAbsolute, currentRelative) => {
    for (const entry of fs.readdirSync(currentAbsolute, { withFileTypes: true })) {
      const nextAbsolute = path.join(currentAbsolute, entry.name);
      const nextRelative = path.join(currentRelative, entry.name);
      if (entry.isDirectory()) {
        walk(nextAbsolute, nextRelative);
      } else if (entry.isFile() && predicate(entry.name, nextRelative)) {
        results.push(nextRelative);
      }
    }
  };

  walk(absolutePath, relativePath);
  return results.sort((a, b) => a.localeCompare(b));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function add(condition, success, failure, target = blockers) {
  if (condition) ok.push(success);
  else target.push(failure);
}

function validateFinalDesignSystem(ds) {
  return Boolean(
    ds &&
      ["3.0.0", "2.0.0", "1.0.0"].includes(String(ds.schema_version ?? "")) &&
      (ds.stage === "final_design_system" || ds.design_system_id || ds.design_system_name) &&
      (hasText(ds.visual_thesis) || hasText(ds.core_message) || hasText(ds.design_system_name) || hasText(ds.name)) &&
      (ds.client_truth || ds.decision_summary || ds.client_signature || ds.inspiration_site) &&
      (ds.repertoire_used || ds.global_reference_repertoire || ds.inspiration_site) &&
      (ds.tokens || ds.colors) &&
      (ds.hero_direction || ds.hero_composition_guardrails || ds.hero || ds.components?.hero) &&
      (ds.navigation_direction || ds.site_build_direction || ds.components?.navigation || ds.components?.buttons) &&
      (ds.media_direction || ds.media_direction_system || ds.composition?.image_treatment || ds.image_treatment) &&
      (ds.section_system || ds.section_hierarchy_system || ds.section_composition_blueprints || ds.composition) &&
      (ds.quality_gate || ds.aesthetic_quality_gate || ds.quality_checklist || ds.accessibility)
  );
}

function validateFinalSiteBuildPrompt(markdown) {
  const normalized = markdown
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const required = [
    "# Prompt Final de Construção",
    "## Prompt Visual Executivo",
    "## Síntese Profunda do Cliente",
    "## Objetivo Comercial",
    "## Primeira Dobra",
    "## Menu e Navegação",
    "## Estrutura do Site",
    "## Checklist de Revisão Visual",
    "## Critério de Pronto",
  ];

  const hasMediaSection =
    markdown.includes("## Mídia, IA e Pexels") ||
    markdown.includes("## Mídia, IA, Pexels e Vídeo") ||
    markdown.includes("## Mídia, Pexels e Vídeo");

  return Boolean(
    hasText(markdown) &&
      markdown.length >= 2500 &&
      required.every((section) => markdown.includes(section)) &&
      hasMediaSection &&
      normalized.includes("primeira dobra") &&
      normalized.includes("menu") &&
      normalized.includes("midia") &&
      normalized.includes("responsiv") &&
      normalized.includes("padrao premium")
  );
}

function validateVisualQualityAudit(audit) {
  return Boolean(
    audit &&
      ["3.0.0", "1.0.0"].includes(String(audit.schema_version ?? "")) &&
      audit.stage === "visual_quality_audit" &&
      ["approved", "approved_with_fixes", "blocked"].includes(audit.status) &&
      (audit.first_fold || audit.aesthetic_checks) &&
      (audit.visual_checks || audit.layout_checks) &&
      (audit.functional_checks || audit.accessibility_checks) &&
      hasArray(audit.deep_review_passes) &&
      hasText(audit.final_recommendation)
  );
}

function hasSignatureElement(ds) {
  return Boolean(ds && (ds.signature_element || ds.client_signature || ds.signature));
}

function hasHonestKnownIssues(audit) {
  return Boolean(audit && Array.isArray(audit.known_issues));
}

function hasHeroCoverageSignal(sourceText) {
  const normalized = normalizeForSniff(sourceText);
  const hasHero = /\b(class|id)=["'][^"']*hero/i.test(sourceText) || normalized.includes("primeira dobra");
  const hasViewportHeight =
    /(min-height|height)\s*:\s*[^;]*(svh|vh|dvh)/i.test(sourceText) ||
    /\b(min-h-screen|h-screen)\b/i.test(sourceText);
  const hasFullBleedWidth =
    /100vw|full-bleed|fullbleed/i.test(sourceText) ||
    /width\s*:\s*100%/i.test(sourceText) ||
    /inset\s*:\s*0/i.test(sourceText);

  return !hasHero || (hasViewportHeight || hasFullBleedWidth);
}

function hasEmptySpaceReview(audit) {
  if (!audit) return false;
  const normalized = normalizeForSniff(JSON.stringify(audit));
  return ["vazio", "buraco", "whitespace", "espaco vazio", "faixa vazia", "padding exagerado"].some((term) =>
    normalized.includes(term)
  );
}

function normalizeForSniff(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const CLICHE_COPY = [
  "bem-vindo ao nosso site",
  "bem vindo ao nosso site",
  "qualidade e compromisso",
  "solucoes personalizadas",
  "transformamos ideias em realidade",
  "transformamos ideias em resultados",
];

const requiredDirectories = [
  "_jumper-sites-system/_cofre-jumper/prompts",
  "_jumper-sites-system/_doc-mestre",
  "_jumper-sites-system/_referencias-visuais",
  "_jumper-sites-system/clientes",
  "_jumper-sites-system/scripts",
];

for (const dir of requiredDirectories) {
  add(isDir(dir), `Pasta encontrada: ${dir}`, `Pasta obrigatoria ausente: ${dir}`);
}

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "package.json",
  "_jumper-sites-system/_cofre-jumper/prompts/build-client-site.prompt.md",
  "_jumper-sites-system/_doc-mestre/DOC-MESTRE.md",
  "_jumper-sites-system/scripts/briefing-to-prompt-pack.mjs",
  "_jumper-sites-system/scripts/check-system-readiness.mjs",
  "_jumper-sites-system/scripts/hydrate-client-assets.mjs",
];

for (const file of requiredFiles) {
  add(exists(file), `Arquivo encontrado: ${file}`, `Arquivo obrigatorio ausente: ${file}`);
}

const referenceFolders = [
  "01-acolhedor-familiar",
  "02-premium-sofisticado",
  "03-energetico-vibrante",
  "04-tecnico-confiavel",
  "05-artesanal-autentico",
  "06-moderno-descolado",
];

for (const folder of referenceFolders) {
  const jsonCount = listFiles(
    `_jumper-sites-system/_referencias-visuais/${folder}/design-systems/json`,
    (name) => name.endsWith(".json")
  ).length;

  if (jsonCount >= 3) {
    ok.push(`DSs-base encontrados: ${folder} (${jsonCount})`);
  } else {
    blockers.push(`DSs-base insuficientes em ${folder}: encontrados ${jsonCount}, esperado minimo 3.`);
  }
}

const legacyBriefings = [
  ...listFiles("_jumper-sites-system/_briefings-gerados", (name) => name !== ".gitkeep"),
  ...listDirs("_jumper-sites-system/_briefings-gerados"),
];

add(
  legacyBriefings.length === 0,
  "Briefings novos ficam em clientes/[slug]/briefing/.",
  "_briefings-gerados contem material legado. Briefings devem ficar em clientes/[slug]/briefing/.",
  warnings
);

const clients = listDirs("_jumper-sites-system/clientes");

for (const slug of clients) {
  const base = `_jumper-sites-system/clientes/${slug}`;
  const hasClientSource = isDir(`${base}/src`);
  const config = readJson(`${base}/jumper.config.json`);
  if (config?.site?.model === "M5") {
    const m5Errors = validateM5Scope(config, readJson(`${base}/data/visual-quality-audit.json`), hasClientSource);
    for (const error of m5Errors) (hasClientSource ? blockers : warnings).push(`Cliente ${slug}: ${error}`);
  }

  const minimalClientFiles = [
    `${base}/jumper.config.json`,
    `${base}/data/design-system.json`,
    `${base}/data/content.json`,
  ];

  for (const file of minimalClientFiles) {
    add(exists(file), `Cliente ${slug}: arquivo encontrado ${file}`, `Cliente ${slug}: arquivo obrigatorio ausente ${file}`, warnings);
  }

  const finalDs = readJson(`${base}/data/final-design-system.json`);
  if (finalDs) {
    add(
      validateFinalDesignSystem(finalDs),
      `Cliente ${slug}: final-design-system.json tem direcao visual suficiente.`,
      `Cliente ${slug}: final-design-system.json esta raso ou incompleto para o fluxo v3.`,
      warnings
    );
    add(
      hasSignatureElement(finalDs),
      `Cliente ${slug}: final-design-system.json define signature_element.`,
      `Cliente ${slug}: final-design-system.json nao define signature_element — todo site precisa de uma assinatura visual nomeada.`,
      warnings
    );
  } else if (hasClientSource) {
    warnings.push(`Cliente ${slug}: src/ existe, mas falta data/final-design-system.json.`);
  } else {
    warnings.push(`Cliente ${slug}: final-design-system.json ainda nao existe.`);
  }

  const finalPrompt = readText(`${base}/data/final-site-build-prompt.md`);
  if (finalPrompt) {
    add(
      validateFinalSiteBuildPrompt(finalPrompt),
      `Cliente ${slug}: final-site-build-prompt.md tem direcao executiva suficiente.`,
      `Cliente ${slug}: final-site-build-prompt.md precisa ficar mais completo antes de construir ou revisar src/.`,
      warnings
    );
  } else if (hasClientSource) {
    warnings.push(`Cliente ${slug}: src/ existe, mas falta data/final-site-build-prompt.md.`);
  }

  const audit = readJson(`${base}/data/visual-quality-audit.json`);
  if (audit) {
    add(
      validateVisualQualityAudit(audit),
      `Cliente ${slug}: visual-quality-audit.json existe e tem revisao final.`,
      `Cliente ${slug}: visual-quality-audit.json esta incompleto para o fluxo v3.`,
      warnings
    );
    add(
      hasHonestKnownIssues(audit),
      `Cliente ${slug}: visual-quality-audit.json registra known_issues (auditoria honesta).`,
      `Cliente ${slug}: visual-quality-audit.json nao tem o campo known_issues — auditoria sem ressalvas registradas nao vale como auditoria honesta.`,
      warnings
    );
  } else if (hasClientSource) {
    warnings.push(`Cliente ${slug}: src/ existe, mas falta data/visual-quality-audit.json.`);
  }

  if (hasClientSource) {
    const sourceFiles = listFilesRecursive(`${base}/src`, (name) => /\.(astro|css|js|ts|jsx|tsx)$/.test(name));
    const sourceText = sourceFiles.map((file) => readText(file)).join("\n");
    const normalizedSource = normalizeForSniff(sourceText);

    const forbiddenVisibleText = [
      "lorem ipsum",
      "rascunho visual",
      "draft media",
    ].filter((term) => sourceText.toLowerCase().includes(term));

    add(
      forbiddenVisibleText.length === 0,
      `Cliente ${slug}: codigo nao contem textos visiveis de rascunho.`,
      `Cliente ${slug}: codigo contem texto de rascunho: ${forbiddenVisibleText.join(", ")}.`,
      warnings
    );

    const clichesFound = CLICHE_COPY.filter((term) => normalizedSource.includes(term));
    add(
      clichesFound.length === 0,
      `Cliente ${slug}: copy nao contem cliches proibidos de oficio.`,
      `Cliente ${slug}: copy contem cliche proibido de oficio: ${clichesFound.join(", ")}. Headlines devem dizer algo que so este cliente diria.`,
      warnings
    );

    const imgWithoutAlt = sourceText.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? [];
    add(
      imgWithoutAlt.length === 0,
      `Cliente ${slug}: todas as tags <img> declaram alt.`,
      `Cliente ${slug}: ${imgWithoutAlt.length} tag(s) <img> sem alt — todo texto alternativo deve ser escrito de verdade.`,
      warnings
    );

    const hasAnimation = /@keyframes|animation\s*:|transition\s*:/.test(sourceText);
    const respectsReducedMotion = sourceText.includes("prefers-reduced-motion");
    add(
      !hasAnimation || respectsReducedMotion,
      `Cliente ${slug}: motion respeita prefers-reduced-motion.`,
      `Cliente ${slug}: existem animacoes/transicoes sem nenhum tratamento de prefers-reduced-motion.`,
      warnings
    );

    const hasHtmlTag = /<html\b/i.test(sourceText);
    const hasLangAttr = /<html\b[^>]*\blang=/i.test(sourceText);
    add(
      !hasHtmlTag || hasLangAttr,
      `Cliente ${slug}: <html> declara lang.`,
      `Cliente ${slug}: <html> sem atributo lang — declare lang="pt-BR" no layout.`,
      warnings
    );

    add(
      hasHeroCoverageSignal(sourceText),
      `Cliente ${slug}: codigo tem sinal de hero dominante/full-bleed.`,
      `Cliente ${slug}: nao ha sinal claro de hero ocupando tela inteira em largura, altura ou ambos. Confirme primeira dobra em todos os viewports.`,
      warnings
    );

    add(
      hasEmptySpaceReview(audit),
      `Cliente ${slug}: auditoria registra revisao de espacos vazios.`,
      `Cliente ${slug}: visual-quality-audit.json deve registrar revisao de espacos vazios/buracos visuais.`,
      warnings
    );
  }
}

console.log("\nJumper Site Factory Doctor v3\n");

for (const message of ok) console.log(`OK  ${message}`);
for (const message of warnings) console.log(`AVISO  ${message}`);
for (const message of blockers) console.log(`ERRO  ${message}`);

if (blockers.length > 0) {
  console.log(`\nResultado: ${blockers.length} bloqueio(s), ${warnings.length} aviso(s).`);
  process.exit(1);
}

console.log(`\nResultado: pronto. ${warnings.length} aviso(s).`);
