// Playwright script: maps the Wordarin app and generates a project.md
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '../docs');
const SCREENS_DIR = path.join(OUT_DIR, 'screens');

fs.mkdirSync(SCREENS_DIR, { recursive: true });

async function shot(page, name, label) {
  const file = path.join(SCREENS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return `./screens/${name}.png`;
}

async function getText(page, selector) {
  try { return await page.locator(selector).first().innerText(); } catch { return ''; }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const sections = [];

  // ── 1. Landing / Curso ──────────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  const logoZh = await getText(page, '.app-logo-zh');
  const logoPt = await getText(page, '.app-logo-pt');
  const tabs = await page.locator('.app-tab').allInnerTexts();

  const cursoImg = await shot(page, '01-curso', 'Curso');

  // Lesson nav items
  const lessons = await page.locator('.lesson-nav-item').allInnerTexts();

  // Click first lesson (intro)
  await page.locator('.lesson-nav-item').first().click();
  await page.waitForTimeout(600);
  const introImg = await shot(page, '02-lesson-intro', 'Lição intro');

  // Section sub-nav
  const subSections = await page.locator('.lesson-nav-sub-item').allInnerTexts().catch(() => []);

  sections.push({
    id: 'curso',
    title: 'Vista Curso',
    img: cursoImg,
    desc: 'Vista principal da plataforma. Menu lateral com a lista de lições. Ao clicar numa lição carrega o conteúdo na área principal.',
    items: lessons,
    subSections,
    extra: `Lição intro screenshot: ${introImg}`,
  });

  // ── 2. Extra – Complete os Textos (FillBlanks) ──────────────────────
  await page.locator('.lesson-nav-extra').click();
  await page.waitForTimeout(800);
  const fbImg = await shot(page, '03-fill-blanks', 'Fill Blanks');

  const fbDiffs = await page.locator('.fb-diff-btn').allInnerTexts().catch(() => []);
  const fbTexts = await page.locator('.fb-text-item').allInnerTexts().catch(() => []);

  sections.push({
    id: 'fill-blanks',
    title: 'Complete os Textos (完形填空)',
    img: fbImg,
    desc: 'Exercício de preenchimento de lacunas. Sidebar com textos organizados por nível e dificuldade. Área principal mostra o texto com lacunas interativas.',
    items: fbDiffs,
    extra: `Textos disponíveis: ${fbTexts.slice(0, 6).join(', ')}…`,
  });

  // ── 3. Editor ───────────────────────────────────────────────────────
  await page.locator('.app-tab').filter({ hasText: 'Editor' }).click();
  await page.waitForTimeout(600);
  const editorImg = await shot(page, '04-editor', 'Editor');

  const toolbarBtns = await page.locator('.toolbar button, .toolbar [role="button"]').allInnerTexts().catch(
    () => page.locator('[class*="toolbar"] button').allInnerTexts().catch(() => [])
  );

  sections.push({
    id: 'editor',
    title: 'Editor de Texto Chinês',
    img: editorImg,
    desc: 'Editor rich-text baseado em Slate.js. Escreve em Mandarim com pinyin automático acima de cada hanzi. Painel de tradução automática ao lado.',
    items: toolbarBtns.filter(Boolean),
  });

  // ── 4. Flashcards ───────────────────────────────────────────────────
  await page.locator('.app-tab').filter({ hasText: 'Flashcards' }).click();
  await page.waitForTimeout(800);
  const fcImg = await shot(page, '05-flashcards', 'Flashcards');

  const fcDecks = await page.locator('.flashcards-deck-select option').allInnerTexts().catch(() => []);
  const fcCounter = await getText(page, '.flashcards-counter');

  sections.push({
    id: 'flashcards',
    title: 'Flashcards',
    img: fcImg,
    desc: 'Sistema de flashcards. Cartão com hanzi (e pinyin sobre cada caractere), face oculta com tradução. Controlos de navegação, áudio e modo aleatório.',
    items: fcDecks,
    extra: `Contador actual: ${fcCounter}`,
  });

  // ── 5. Header toggles ───────────────────────────────────────────────
  const headerToggles = await page.locator('.header-toggle-btn').allInnerTexts().catch(() => []);

  await browser.close();

  // ── Generate Markdown ───────────────────────────────────────────────
  const md = `# Wordarin — Mapeamento do Projecto

> Gerado automaticamente por Playwright em ${new Date().toISOString().slice(0, 16).replace('T', ' ')}
> App: ${BASE_URL}

---

## Visão Geral

**${logoZh} · ${logoPt}** é uma plataforma de aprendizagem de Mandarim (Chinês Contemporâneo, Básico 1).
Tecnologias: React 19 · Vite · Slate.js · pinyin-pro · hanzi-writer.

### Navegação principal (tabs)
${tabs.map(t => `- **${t.trim()}**`).join('\n')}

### Controlos globais (header)
${headerToggles.map(t => `- \`${t.trim()}\``).join('\n')}

---

${sections.map(s => `## ${s.title}

![${s.title}](${s.img})

${s.desc}

${s.items?.length ? `### Itens\n${s.items.map(i => `- ${i.trim()}`).filter(Boolean).join('\n')}` : ''}

${s.subSections?.length ? `### Sub-secções de lição\n${s.subSections.map(i => `- ${i.trim()}`).join('\n')}` : ''}

${s.extra ? `> ${s.extra}` : ''}
`).join('\n---\n\n')}

---

## Estrutura de ficheiros

\`\`\`
src/
├── App.jsx           # Root: routing entre views, estado global do editor
├── Editor.jsx        # Slate rich-text editor com pinyin inline
├── Toolbar.jsx       # Barra de ferramentas do editor
├── CourseView.jsx    # Vista de lição: vocab, diálogos, gramática, exercícios, traços
├── LessonNav.jsx     # Sidebar de navegação de lições
├── Flashcards.jsx    # Sistema de flashcards
├── FillBlanks.jsx    # Exercício de preenchimento (完形填空)
├── AudioPlayer.jsx   # Player de áudio com controlos
├── StrokeOrder.jsx   # Animação de ordem dos traços (hanzi-writer)
├── IMEProvider.jsx   # IME: input de pinyin → hanzi
└── ChineseKeyboard.jsx # Teclado chinês on-screen

public/
├── course-data.json  # Lições, vocabulário, gramática, exercícios
├── flashcards.json   # Decks de flashcards
├── study_texts.json  # Textos para preenchimento de lacunas
└── audio/            # Ficheiros de áudio das lições
\`\`\`

---

## Componentes internos de CourseView

| Componente | Função |
|---|---|
| \`HanziRuby\` | Renderiza hanzi com pinyin acima de cada caractere |
| \`VocabCard\` | Cartão de vocabulário com hanzi/pinyin/tradução e botão de áudio |
| \`VocabWhiteboard\` | Painel inline de prática de traços para item de vocab |
| \`DialogueList\` | Lista de expressões/saudações clicáveis com TTS |
| \`TextScene\` | Diálogo com personagens e tradução |
| \`GrammarSection\` | Regras gramaticais com exemplos afirmativo/negativo |
| \`ExFill\` | Exercício fill-in-the-blank |
| \`ExTranslate\` | Exercício de tradução com resposta ocultável |
| \`ExTransform\` | Exercício de transformação de frases |
| \`ExMatch\` | Exercício de correspondência (colunas) |
| \`ExToneIdentify\` | Exercício de identificação de tons |
| \`PhoneticsSection\` | Tabela de iniciais/finais/tons com tabs |
| \`CharactersSection\` | Grelha de caracteres com traços e pronúncia |
| \`StrokePanel\` | Painel lateral de prática de traços |
`;

  const outFile = path.join(OUT_DIR, 'project-map.md');
  fs.writeFileSync(outFile, md, 'utf8');
  console.log('✅  Mapa gerado em:', outFile);
  console.log('📸  Screenshots em:', SCREENS_DIR);
})();
