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
// HTML fragments
// ---------------------------------------------------------------------------

function renderTags(tags) {
  if (!tags?.length) return '';
  return `<ul class="tag-list" role="list">${
    tags.map(t => `<li class="tag">${escapeHtml(t)}</li>`).join('')
  }</ul>`;
}

function renderIngredients(ingredients) {
  const rows = ingredients.map(i => `
        <li class="ingredient-row">
          <span class="ing-qty">${escapeHtml(i.quantity)}</span>
          <span class="ing-name">${escapeHtml(i.name)}</span>
          <span class="ing-cost">${fmt(i.costContribution)}</span>
        </li>`).join('');

  const total = ingredients.reduce((sum, i) => sum + i.costContribution, 0);

  return `<ul class="ingredients-list" role="list">
      <li class="ingredient-header" aria-hidden="true">
        <span>Amount</span><span>Ingredient</span><span>Est. cost</span>
      </li>
      ${rows}
      <li class="ingredient-total">
        <span></span><span>Recipe total</span><span>${fmt(total)}</span>
      </li>
    </ul>`;
}

function renderInstructions(steps) {
  return `<ol class="instructions-list" role="list">${
    steps.map((step, i) => `
      <li class="instruction-step">
        <span class="step-num" aria-hidden="true">${i + 1}</span>
        <span class="step-text">${escapeHtml(step)}</span>
      </li>`).join('')
  }</ol>`;
}

function renderNutrition(n) {
  const primary = [
    { label: 'Calories',  value: n.calories,  unit: ''   },
    { label: 'Protein',   value: n.protein,   unit: 'g'  },
    { label: 'Carbs',     value: n.carbs,     unit: 'g'  },
    { label: 'Fat',       value: n.fat,       unit: 'g'  },
    { label: 'Fiber',     value: n.fiber,     unit: 'g'  },
    { label: 'Sodium',    value: n.sodium,    unit: 'mg' },
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

  const secondaryHtml = secondary.length
    ? `<div class="nutrition-secondary">${
        secondary.map(item =>
          `<span class="nutrition-dv"><strong>${escapeHtml(String(item.value))}</strong> ${item.label}</span>`
        ).join('')
      }</div>`
    : '';

  return `<p class="nutrition-note">Estimated values per serving.</p>
    <div class="nutrition-grid">${primaryHtml}</div>
    ${secondaryHtml}`;
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

function renderBudgetNotes(notes) {
  if (!notes?.length) return '';
  return `<section class="recipe-section budget-notes-section">
      <h2>Budget Notes</h2>
      <ul class="budget-notes-list">${
        notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')
      }</ul>
    </section>`;
}

function renderPricingMeta(meta) {
  if (!meta) return '';
  const sources = meta.sources.join(' and ');
  const extra   = meta.notes ? ` ${escapeHtml(meta.notes)}` : '';
  return `<aside class="pricing-meta">
      <p>Pricing updated ${escapeHtml(meta.updatedAt)} using ${escapeHtml(sources)} averages.${extra}</p>
    </aside>`;
}

// ---------------------------------------------------------------------------
// Page layouts
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
  <link rel="stylesheet" href="${base}styles/main.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="site-header">
    <div class="container">
      <a href="${logoHref}" class="site-logo">Overdraft Kitchen</a>
      <p class="site-tagline">Affordable meals for real life. Under $15 for four.</p>
    </div>
  </header>
  <main id="main-content">
    <div class="container">
      ${content}
    </div>
  </main>
  <footer class="site-footer">
    <div class="container">
      <p>Prices are estimates based on Ottawa and Ontario grocery store averages. Nutritional values are estimates. Regional prices vary.</p>
    </div>
  </footer>
</body>
</html>`;
}

function renderRecipePage(recipe) {
  const content = `
    <article class="recipe-page">
      <header class="recipe-header">
        <p class="breadcrumb"><a href="../index.html">&larr; All Recipes</a></p>
        <h1>${escapeHtml(recipe.name)}</h1>
        <p class="recipe-summary">${escapeHtml(recipe.summary)}</p>
        <div class="recipe-meta-strip">
          <div class="meta-item meta-cost">
            <span class="meta-label">Total Cost</span>
            <span class="meta-value">${fmt(recipe.totalCost)}</span>
          </div>
          <div class="meta-item meta-cost">
            <span class="meta-label">Per Serving</span>
            <span class="meta-value">${fmt(recipe.costPerServing)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Prep</span>
            <span class="meta-value">${escapeHtml(recipe.prepTime)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Cook</span>
            <span class="meta-value">${escapeHtml(recipe.cookTime)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Servings</span>
            <span class="meta-value">${recipe.servings}</span>
          </div>
        </div>
        ${renderTags(recipe.tags)}
      </header>

      <section class="recipe-section">
        <h2>Ingredients</h2>
        ${renderIngredients(recipe.ingredients)}
      </section>

      <section class="recipe-section">
        <h2>Instructions</h2>
        ${renderInstructions(recipe.instructions)}
      </section>

      <section class="recipe-section">
        <h2>Nutrition per Serving</h2>
        ${renderNutrition(recipe.nutrition)}
      </section>

      <section class="recipe-section gf-section">
        <h2>Gluten-Free</h2>
        ${renderGlutenFree(recipe.glutenFree)}
      </section>

      ${renderBudgetNotes(recipe.budgetNotes)}
      ${renderPricingMeta(recipe.pricingMetadata)}
    </article>`;

  return pageLayout({
    title:       `${recipe.name} — Overdraft Kitchen`,
    description: `${recipe.summary} Feeds ${recipe.servings}. ${fmt(recipe.totalCost)} total.`,
    content,
    isRoot: false,
  });
}

function renderRecipeCard(recipe) {
  return `
    <article class="recipe-card" data-tags="${recipe.tags.join(',')}">
      <div class="recipe-card-cost">
        <span class="card-cost-per">${fmt(recipe.costPerServing)}<span class="card-cost-label">/serving</span></span>
        <span class="card-total">${fmt(recipe.totalCost)} total</span>
      </div>
      <div class="recipe-card-body">
        <h2 class="recipe-card-name"><a href="recipes/${recipe.id}.html">${escapeHtml(recipe.name)}</a></h2>
        <p class="recipe-card-summary">${escapeHtml(recipe.summary)}</p>
        <div class="recipe-card-meta">
          <span>${recipe.servings} servings</span>
          <span>${escapeHtml(recipe.prepTime)} prep</span>
          <span>${escapeHtml(recipe.cookTime)} cook</span>
        </div>
        ${renderTags(recipe.tags)}
      </div>
    </article>`;
}

function renderIndexPage(recipes) {
  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();

  const filterBar = `
    <div class="tag-filter-bar" role="group" aria-label="Filter recipes by tag">
      <span class="tag-filter-label">Filter by</span>
      <div class="tag-filter-btns">
        ${allTags.map(t => `<button class="tag-filter-btn" data-tag-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('')}
      </div>
      <button class="tag-filter-clear" id="tag-filter-clear" aria-label="Clear filter" hidden>Clear filter</button>
    </div>`;

  const content = `
    <section class="site-about">
      <p>You know how groceries are right now. These recipes feed four people for under $15 and hit at least 400 calories per serving — no premium ingredients, no lifestyle branding, just meals that work when the bank account doesn't. Priced against Ottawa and Ontario grocery store averages for 2026, which is, frankly, a lot to ask of anyone.</p>
    </section>
    <div class="site-stats" role="list">
      <div class="stat" role="listitem">
        <span class="stat-value">Under $15</span>
        <span class="stat-label">feeds four people</span>
      </div>
      <div class="stat" role="listitem">
        <span class="stat-value">400+ cal</span>
        <span class="stat-label">per serving</span>
      </div>
      <div class="stat" role="listitem">
        <span class="stat-value">GF option</span>
        <span class="stat-label">on every recipe</span>
      </div>
      <div class="stat" role="listitem">
        <span class="stat-value">${recipes.length} recipes</span>
        <span class="stat-label">and counting</span>
      </div>
    </div>

    <section class="recipes-section">
      <h2 class="recipes-heading">Recipes <span class="recipe-count" id="recipe-filter-count">${recipes.length}</span></h2>
      ${filterBar}
      <div class="recipe-grid" id="recipe-grid">
        ${recipes.map(renderRecipeCard).join('')}
      </div>
      <p class="filter-empty" id="filter-empty" hidden>No recipes match that filter.</p>
    </section>

    <script>
    (function () {
      var active = null;
      var btns   = document.querySelectorAll('[data-tag-filter]');
      var cards  = document.querySelectorAll('[data-tags]');
      var count  = document.getElementById('recipe-filter-count');
      var clear  = document.getElementById('tag-filter-clear');
      var empty  = document.getElementById('filter-empty');

      function update() {
        var shown = 0;
        cards.forEach(function (card) {
          var tags  = card.dataset.tags ? card.dataset.tags.split(',') : [];
          var match = !active || tags.indexOf(active) !== -1;
          card.style.display = match ? '' : 'none';
          if (match) shown++;
        });
        if (count) count.textContent = shown;
        if (clear) clear.hidden = !active;
        if (empty) empty.hidden = shown > 0;
      }

      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tag = this.dataset.tagFilter;
          active  = active === tag ? null : tag;
          btns.forEach(function (b) {
            b.classList.toggle('active', b.dataset.tagFilter === active);
          });
          update();
        });
      });

      if (clear) {
        clear.addEventListener('click', function () {
          active = null;
          btns.forEach(function (b) { b.classList.remove('active'); });
          update();
        });
      }
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
