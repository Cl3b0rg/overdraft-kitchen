# Overdraft Kitchen

A static Canadian budget recipe website. Live at https://cl3b0rg.github.io/overdraft-kitchen/
GitHub repo: https://github.com/Cl3b0rg/overdraft-kitchen

## What this is

A no-nonsense recipe site for people struggling with grocery costs in Canada. Every recipe must:
- Feed 4 people
- Cost under CAD $15 total (priced against Ottawa Walmart / No Frills averages)
- Provide at least 400 calories per serving
- Include a gluten-free version or substitution
- Use ingredients available at Ontario grocery stores

## How the site works

Zero-dependency Node.js static site generator.

```
node build.js        # builds everything into docs/
npx serve docs       # preview locally
```

- Recipe data lives in `/recipes/*.json`
- `build.js` reads those files and renders HTML into `/docs/`
- `src/styles/main.css` is copied to `docs/styles/main.css` at build time
- GitHub Actions builds and deploys on every push to `main`
- `docs/` is gitignored — never commit it

## Adding a recipe

1. Create a new JSON file in `/recipes/` following the schema below
2. Run `node build.js` to verify it builds and passes validation (no warnings)
3. Commit and push — CI handles deployment

The build script validates: total cost ≤ $15, servings ≥ 4, calories ≥ 400, glutenFree field present.

## Recipe JSON schema

```json
{
  "id": "kebab-case-filename",
  "name": "Recipe Name",
  "summary": "One sentence. Practical, no adjectives.",
  "totalCost": 0.00,
  "costPerServing": 0.00,
  "servings": 4,
  "prepTime": "X min",
  "cookTime": "X min",
  "tags": ["gluten-free", "vegan", "etc"],

  "ingredients": [
    { "quantity": "X g", "name": "ingredient", "costContribution": 0.00 }
  ],

  "instructions": [
    "Step one.",
    "Step two."
  ],

  "nutrition": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sodium": 0,
    "iron": "~X% DV",
    "calcium": "~X% DV",
    "vitaminC": "~X% DV"
  },

  "glutenFree": {
    "isNaturallyGF": true,
    "substitutions": [
      { "ingredient": "X", "substitute": "Y", "costNote": "optional" }
    ],
    "notes": "optional"
  },

  "budgetNotes": ["Optional tips."],

  "pricingMetadata": {
    "updatedAt": "Month YYYY",
    "sources": ["Ottawa Walmart", "Ottawa No Frills"],
    "notes": "Pricing assumptions."
  }
}
```

## Pricing rules

- Use Ottawa Walmart and No Frills as primary sources
- Price ingredients proportionally (if a 900g bag is $3.99 and recipe uses 300g, cost = $1.33)
- Never hardcode totals that contradict ingredient sums
- Use realistic 2026 Canadian grocery pricing
- Preferred stores: Walmart Canada, No Frills, FreshCo, Food Basics, Superstore
- Round prices reasonably
- Mark estimates as estimates — never fabricate precision

## Writing tone

The site has a dry, self-aware tone about being broke in 2026. The about text sets the tone:

> "Somewhere between the $9 red peppers and the $22 ground beef, grocery shopping became a hostile act."

Recipe summaries should be practical and direct. Examples:
- Good: "A cheap, filling rice and beef skillet that reheats well."
- Bad: "This hearty budget bowl will absolutely blow your mind!"

Avoid: influencer language, fake storytelling, "life changing" claims, SEO filler, emojis, excessive adjectives.

## Design notes

- Dark header (`#1c1a17`) with green bottom border
- Warm off-white background (`#f4f1eb`)
- Green accent (`#2a6130`) for card top borders, section headings, step numbers
- Amber/cost color (`#7a5410`) for pricing callouts
- System font stack — no web fonts
- Tag filter bar on index page (vanilla JS, no dependencies)
- Mobile-first, accessible, semantic HTML

## Current recipe count

25 recipes as of May 2026.

## Git identity (this machine)

- user.name: Cl3b0rg
- user.email: Cl3b0rg@users.noreply.github.com
- These are set locally in the repo, not globally
