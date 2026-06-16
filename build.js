'use strict';

const fs   = require('fs');
const path = require('path');

const DIR = {
  recipes: path.join(__dirname, 'recipes'),
  src:     path.join(__dirname, 'src'),
  docs:    path.join(__dirname, 'docs'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n) {
  return `$${Number(n).toFixed(2)}`;
}

function fmtBare(n) {
  return Number(n).toFixed(2);
}

/** Decorative barcode string derived from recipe total. */
function barcodeCode(recipe) {
  const cents = Math.round(recipe.totalCost * 100);
  const pad   = String(cents).padStart(5, '0');
  return `8 06420 ${pad} ${(cents % 9) + 1}`;
}

function validate(recipe) {
  const issues = [];
  if (recipe.totalCost > 15)            issues.push(`total cost ${fmt(recipe.totalCost)} exceeds $15`);
  if (recipe.servings < 4)              issues.push(`servings (${recipe.servings}) under 4`);
  if (recipe.nutrition?.calories < 400) issues.push(`calories (${recipe.nutrition?.calories}) under 400`);
  if (!recipe.glutenFree)               issues.push('missing glutenFree field');
  if (!recipe.pricingMetadata)          issues.push('missing pricingMetadata field');
  if (issues.length) {
    console.warn(`  WARNING ${recipe.name}: ${issues.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// Shared partials
// ---------------------------------------------------------------------------

function renderNutrition(n) {
  const primary = [
    { label: 'Calories', value: n.calories,  unit: ''   },
    { label: 'Protein',  value: n.protein,   unit: 'g'  },
    { label: 'Carbs',    value: n.carbs,     unit: 'g'  },
    { label: 'Fat',      value: n.fat,       unit: 'g'  },
    { label: 'Fiber',    value: n.fiber,     unit: 'g'  },
    { label: 'Sodium',   value: n.sodium,    unit: 'mg' },
  ];
  const secondary = [];
  if (n.iron)     secondary.push({ label: 'Iron',      value: n.iron      });
  if (n.calcium)  secondary.push({ label: 'Calcium',   value: n.calcium   });
  if (n.vitaminC) secondary.push({ label: 'Vitamin C', value: n.vitaminC  });

  const primaryHtml = primary.map(item => `
        <div class="nutrition-item">
          <span class="nutrition-value">${item.value}${item.unit}</span>
          <span class="nutrition-label">${item.label}</span>
        </div>`).join('');

  const dvHtml = secondary.length
    ? `<div class="nutrition-dv-row">${
        secondary.map(item =>
          `<span class="nutrition-dv"><strong>${escapeHtml(String(item.value))}</strong> ${item.label}</span>`
        ).join('')
      }</div>`
    : '';

  return `<div class="nutrition-grid">${primaryHtml}</div>
      ${dvHtml}
      <p class="nutrition-note">Estimated values per serving.</p>`;
}

function renderGlutenFree(gf) {
  if (!gf) return '<p>No gluten-free information provided.</p>';
  let html = '';
  if (gf.isNaturallyGF) {
    html += `<p class="gf-status gf-natural">This recipe is naturally gluten-free.</p>`;
  } else {
    html += `<p class="gf-status gf-modified">This recipe can be made gluten-free with substitutions.</p>`;
    if (gf.substitutions?.length) {
      html += `<ul class="gf-subs">${
        gf.substitutions.map(sub =>
          `<li>Replace <strong>${escapeHtml(sub.ingredient)}</strong> with ${escapeHtml(sub.substitute)}` +
          (sub.costNote ? ` <span class="gf-cost-note">(${escapeHtml(sub.costNote)})</span>` : '') +
          `</li>`
        ).join('')
      }</ul>`;
    }
  }
  if (gf.notes) html += `<p class="gf-notes">${escapeHtml(gf.notes)}</p>`;
  return html;
}

// ---------------------------------------------------------------------------
// Page layout (header + footer)
// ---------------------------------------------------------------------------

function pageLayout({ title, description, content, isRoot }) {
  const base     = isRoot ? '' : '../';
  const logoHref = isRoot ? 'index.html' : '../index.html';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="msvalidate.01" content="9B55CFF082D19CBE68CEA20519C74862">
  <meta name="google-site-verification" content="dGLR95j9KdelSnpB5EdR7TIBH9mhT-M7zPn5CzQiNHA">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${base}styles/main.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <svg class="paper-noise" aria-hidden="true">
    <filter id="paperNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch"></feTurbulence>
      <feColorMatrix type="saturate" values="0"></feColorMatrix>
    </filter>
    <rect width="100%" height="100%" filter="url(#paperNoise)"></rect>
  </svg>

  <div class="site-wrap">
    <header class="site-header">
      <div class="container">
        <a href="${logoHref}" class="site-logo">
          <div class="logo-mark">$</div>
          <div class="logo-text">
            <div class="logo-name"><span class="logo-overdraft">Overdraft</span> <span class="logo-kitchen">Kitchen</span></div>
            <span class="logo-url">OVERDRAFTKITCHEN.CA</span>
          </div>
        </a>
        <div class="header-right">
          <p class="header-tagline">Affordable meals for real life. <strong>Under $15 for four.</strong></p>
          <span class="cad-pill">CAD</span>
        </div>
      </div>
    </header>

    <main id="main-content">
      ${content}
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-brand">
          <div class="footer-wordmark"><span class="fw-overdraft">Overdraft</span> <span class="fw-kitchen">Kitchen</span></div>
          <div class="footer-tagline">Just food that works when the math doesn't.</div>
        </div>
        <div class="footer-meta">OTTAWA, ONTARIO &middot; PRICES IN CAD<br>LAST VERIFIED JUNE 2026 &middot; OVERDRAFTKITCHEN.CA</div>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

function renderRecipeCard(recipe) {
  const cal = recipe.nutrition?.calories ?? '—';
  return `
  <a href="recipes/${recipe.id}.html" class="recipe-card"
     data-tags="${escapeHtml(recipe.tags.join(','))}"
     data-name="${escapeHtml(recipe.name.toLowerCase())}"
     data-desc="${escapeHtml(recipe.summary.toLowerCase())}">
    <div class="card-accent-strip"></div>
    <div class="card-price-band">
      <div class="card-per-serving">
        <span class="card-price-big">$${fmtBare(recipe.costPerServing)}</span>
        <span class="card-price-unit">/serving</span>
      </div>
      <div class="card-total-block">
        <span class="card-total-amount">$${fmtBare(recipe.totalCost)}</span>
        <span class="card-total-label">Total &middot; ${recipe.servings} serv</span>
      </div>
    </div>
    <div class="card-body">
      <h2 class="card-title">${escapeHtml(recipe.name)}</h2>
      <p class="card-desc">${escapeHtml(recipe.summary)}</p>
      <div class="card-meta">
        <span>${recipe.servings} SERVINGS</span>
        <span class="card-meta-dot">&middot;</span>
        <span>${cal} CAL</span>
        <span class="card-meta-dot">&middot;</span>
        <span>${escapeHtml(recipe.prepTime)} PREP</span>
        <span class="card-meta-dot">&middot;</span>
        <span>${escapeHtml(recipe.cookTime)} COOK</span>
      </div>
      <div class="card-tags">
        ${recipe.tags.map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="card-footer-cta">
        <span class="card-cta">SEE THE RECEIPT &rarr;</span>
      </div>
    </div>
  </a>`;
}

function renderIndexPage(recipes) {
  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();
  const count   = recipes.length;

  const filterPills = allTags.map(t =>
    `<button class="filter-pill" data-tag="${escapeHtml(t)}" type="button">${escapeHtml(t)}</button>`
  ).join('');

  const cards = recipes.map(renderRecipeCard).join('');

  const content = `
    <section class="manifesto-section">
      <div class="container">
        <div class="manifesto-inner">
          <div class="manifesto-kicker">&mdash; THE SITUATION &mdash;</div>
          <p class="manifesto-body">Somewhere between the <span class="hl-rust">$9 red peppers</span> and the <span class="hl-rust">$22 ground beef</span>, grocery shopping became a hostile act. Overdraft Kitchen is the response. Meals that feed four for under <span class="hl-green">$15</span>, priced against what you're actually paying in Ottawa in 2026. No fancy ingredients, no wellness branding, no pretending this is fun. Just food that works when the math doesn't.</p>
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="container">
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value stat-value--cream">Under $15</span>
            <span class="stat-label">Feeds Four People</span>
          </div>
          <div class="stat">
            <span class="stat-value stat-value--gold">400+ cal</span>
            <span class="stat-label">Per Serving</span>
          </div>
          <div class="stat">
            <span class="stat-value stat-value--cream">GF option</span>
            <span class="stat-label">On Every Recipe</span>
          </div>
          <div class="stat">
            <span class="stat-value stat-value--gold">${count} recipes</span>
            <span class="stat-label">And Counting</span>
          </div>
        </div>
      </div>
    </section>

    <section class="recipes-section">
      <div class="container">
        <div class="recipes-header">
          <div class="recipes-header-left">
            <div class="recipes-kicker">The Recipes</div>
            <h1 class="recipes-heading">Cheap dinners, fully itemized</h1>
          </div>
          <div class="recipes-controls">
            <span class="recipes-shown-count" id="shown-count">${count} SHOWN</span>
            <input class="recipes-search" id="recipe-search" type="search"
                   placeholder="Search recipes, tags&hellip;" aria-label="Search recipes">
          </div>
        </div>

        <div class="filter-panel">
          <div class="filter-panel-header">
            <span class="filter-label">Filter by</span>
            <button class="filter-clear" id="filter-clear" type="button">
              &times; CLEAR (<span id="filter-active-count">0</span>)
            </button>
          </div>
          <div class="filter-pills" id="filter-pills">
            ${filterPills}
          </div>
        </div>

        <div class="recipe-grid" id="recipe-grid">
          ${cards}
        </div>

        <div class="grid-empty" id="grid-empty" aria-live="polite">
          <div class="empty-label">NO MATCHES</div>
          <p class="empty-message">Nothing fits that combo yet. Try fewer filters.</p>
          <button class="empty-reset" id="empty-reset" type="button">RESET FILTERS</button>
        </div>
      </div>
    </section>

    <script>
    (function () {
      var activeTags = [];
      var query      = '';
      var pills      = document.querySelectorAll('.filter-pill');
      var cards      = document.querySelectorAll('.recipe-card');
      var shownEl    = document.getElementById('shown-count');
      var clearBtn   = document.getElementById('filter-clear');
      var activeCountEl = document.getElementById('filter-active-count');
      var emptyEl    = document.getElementById('grid-empty');
      var gridEl     = document.getElementById('recipe-grid');
      var searchEl   = document.getElementById('recipe-search');
      var resetBtn   = document.getElementById('empty-reset');

      function update() {
        var q = query.toLowerCase().trim();
        var shown = 0;
        cards.forEach(function (card) {
          var tags = card.dataset.tags ? card.dataset.tags.split(',') : [];
          var matchTags = activeTags.every(function (t) { return tags.indexOf(t) !== -1; });
          var hay = (card.dataset.name || '') + ' ' + (card.dataset.desc || '') + ' ' + (card.dataset.tags || '');
          var matchSearch = !q || hay.indexOf(q) !== -1;
          var visible = matchTags && matchSearch;
          card.style.display = visible ? '' : 'none';
          if (visible) shown++;
        });
        if (shownEl) shownEl.textContent = shown + ' SHOWN';
        if (activeCountEl) activeCountEl.textContent = activeTags.length;
        var hasFilters = activeTags.length > 0 || q.length > 0;
        if (clearBtn) clearBtn.classList.toggle('visible', hasFilters);
        if (emptyEl)  emptyEl.classList.toggle('visible', shown === 0);
        if (gridEl)   gridEl.style.display = shown === 0 ? 'none' : '';
      }

      pills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          var tag = this.dataset.tag;
          var idx = activeTags.indexOf(tag);
          if (idx === -1) { activeTags.push(tag); } else { activeTags.splice(idx, 1); }
          this.classList.toggle('active', activeTags.indexOf(tag) !== -1);
          update();
        });
      });

      if (searchEl) {
        searchEl.addEventListener('input', function () {
          query = this.value;
          update();
        });
      }

      function clearAll() {
        activeTags = [];
        query = '';
        if (searchEl) searchEl.value = '';
        pills.forEach(function (p) { p.classList.remove('active'); });
        update();
      }

      if (clearBtn) clearBtn.addEventListener('click', clearAll);
      if (resetBtn) resetBtn.addEventListener('click', clearAll);
    })();
    </script>`;

  return pageLayout({
    title:       'Overdraft Kitchen — Affordable Recipes for Canadians',
    description: 'Straightforward recipes for when money is tight. All recipes feed four people for under $15.',
    content,
    isRoot: true,
  });
}

// ---------------------------------------------------------------------------
// Recipe detail page
// ---------------------------------------------------------------------------

function renderReceipt(recipe) {
  const code       = barcodeCode(recipe);
  const totalFmt   = fmtBare(recipe.totalCost);
  const perServFmt = fmtBare(recipe.costPerServing);

  const rows = recipe.ingredients.map(i => `
        <div class="receipt-row">
          <span class="receipt-row-name">${escapeHtml(i.quantity)} ${escapeHtml(i.name)}</span>
          <span class="receipt-row-dots"></span>
          <span class="receipt-row-price">$${fmtBare(i.costContribution)}</span>
        </div>`).join('');

  return `<div class="receipt-card">
      <div class="receipt-header">
        <div class="receipt-store">OVERDRAFT KITCHEN</div>
        <div class="receipt-subtitle">&starf; ITEMIZED GROCERY RECEIPT &starf;</div>
        <div class="receipt-recipe-name">${escapeHtml(recipe.name)}</div>
        <div class="receipt-serves">SERVES ${recipe.servings} &middot; OTTAWA &middot; 2026</div>
      </div>
      <div class="receipt-items">${rows}</div>
      <div class="receipt-totals">
        <div class="receipt-subtotal"><span>SUBTOTAL</span><span>$${totalFmt}</span></div>
        <div class="receipt-tax"><span>GST / HST</span><span>you've suffered enough</span></div>
        <div class="receipt-total-row"><span>TOTAL</span><span>$${totalFmt}</span></div>
      </div>
      <div class="receipt-per-serving">
        <div class="receipt-ps-label">COST PER SERVING</div>
        <div class="receipt-ps-amount">$${perServFmt}</div>
      </div>
      <div class="receipt-tear">&mdash; &mdash; &mdash; TEAR HERE &mdash; &mdash; &mdash;</div>
      <div class="receipt-barcode"></div>
      <div class="receipt-barcode-num">${escapeHtml(code)}</div>
      <div class="receipt-thanks">THANK YOU FOR SPENDING LESS</div>
    </div>`;
}

function renderMethod(steps) {
  return steps.map((step, i) => `
      <div class="method-step">
        <div class="step-circle">${i + 1}</div>
        <p class="step-text">${escapeHtml(step)}</p>
      </div>`).join('');
}

function renderSwapCallout(budgetNotes) {
  if (!budgetNotes?.length) return '';
  const [first, ...rest] = budgetNotes;
  const restHtml = rest.length
    ? `<ul class="swap-notes-list">${rest.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : '';
  return `
    <div class="swap-callout">
      <div class="swap-callout-label">When the math doesn't work</div>
      <p class="swap-callout-text">${escapeHtml(first)}</p>
      ${restHtml}
    </div>`;
}

function renderRecipePage(recipe) {
  const totalFmt = fmtBare(recipe.totalCost);
  const cal      = recipe.nutrition?.calories ?? '—';

  const pricingMeta = recipe.pricingMetadata
    ? `<p class="pricing-meta">${
        escapeHtml(`Pricing updated ${recipe.pricingMetadata.updatedAt} using ${recipe.pricingMetadata.sources.join(' and ')} averages.`)
      }${recipe.pricingMetadata.notes ? ' ' + escapeHtml(recipe.pricingMetadata.notes) : ''}</p>`
    : '';

  const content = `
  <div class="container--detail">
    <div class="detail-main">
      <a href="../index.html" class="back-link">&larr; ALL RECIPES</a>

      <h1 class="detail-title">${escapeHtml(recipe.name)}</h1>
      <p class="detail-desc">${escapeHtml(recipe.summary)}</p>

      <div class="detail-tags">
        ${recipe.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}
      </div>

      <div class="detail-meta-strip">
        <span>SERVES ${recipe.servings}</span>
        <span>${cal} CAL / SERVING</span>
        <span>${escapeHtml(recipe.prepTime)} PREP</span>
        <span>${escapeHtml(recipe.cookTime)} COOK</span>
        <span class="meta-total">$${totalFmt} TOTAL</span>
      </div>

      <div class="detail-grid">
        ${renderReceipt(recipe)}
        <div class="method-col">
          <div class="method-kicker">THE METHOD</div>
          <div class="method-steps">
            ${renderMethod(recipe.instructions)}
          </div>
          ${renderSwapCallout(recipe.budgetNotes)}
        </div>
      </div>

      <div class="detail-sections">
        <div class="detail-section-card">
          <div class="detail-section-kicker">Nutrition Per Serving</div>
          ${renderNutrition(recipe.nutrition)}
        </div>
        <div class="detail-section-card">
          <div class="detail-section-kicker">Gluten-Free</div>
          ${renderGlutenFree(recipe.glutenFree)}
        </div>
      </div>

      ${pricingMeta}
    </div>
  </div>`;

  return pageLayout({
    title:       `${recipe.name} — Overdraft Kitchen`,
    description: `${recipe.summary} Feeds ${recipe.servings}. ${fmt(recipe.totalCost)} total.`,
    content,
    isRoot: false,
  });
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build() {
  const outRecipes = path.join(DIR.docs, 'recipes');
  const outStyles  = path.join(DIR.docs, 'styles');
  [DIR.docs, outRecipes, outStyles].forEach(d => fs.mkdirSync(d, { recursive: true }));

  fs.copyFileSync(
    path.join(DIR.src, 'styles', 'main.css'),
    path.join(outStyles, 'main.css')
  );

  const recipes = fs.readdirSync(DIR.recipes)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(DIR.recipes, f), 'utf8')))
    .sort((a, b) => a.name.localeCompare(b.name));

  recipes.forEach(validate);

  recipes.forEach(recipe => {
    fs.writeFileSync(path.join(outRecipes, `${recipe.id}.html`), renderRecipePage(recipe));
    console.log(`  built  recipes/${recipe.id}.html`);
  });

  fs.writeFileSync(path.join(DIR.docs, 'index.html'), renderIndexPage(recipes));
  console.log(`  built  index.html`);
  console.log(`\nDone. ${recipes.length} recipe(s).`);
}

build();
