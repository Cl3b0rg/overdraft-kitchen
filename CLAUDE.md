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

**If a recipe exceeds $15 at real verified prices, remove it from the site entirely. Do not adjust ingredient quantities or swap ingredients just to squeeze it under the limit. The $15 rule is the point — fudging it to keep a recipe defeats the purpose.**

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

## Footer price date

The site footer in `build.js` reads:
> "Prices are estimates based on Ottawa and Ontario grocery store averages. Nutritional values are estimates. Regional prices vary."

**Whenever recipe prices are updated, also update this footer line in `build.js` to append the date prices were last verified**, e.g.:
> "Prices are estimates based on Ottawa and Ontario grocery store averages. Last verified May 2026. Nutritional values are estimates. Regional prices vary."

The footer text is in the `pageLayout` function inside `build.js`. Update it as part of any pricing commit.

## Pricing rules

- Use the validated price list below for ALL ingredient costs — do not guess
- Price ingredients proportionally (if a 2 kg bag is $5.00 and recipe uses 300 g: $5.00 × 300/2000 = $0.75)
- Never hardcode totals that contradict the sum of ingredient costContributions
- Sources: No Frills (nofrills.ca) and Walmart Canada (walmart.ca), Ottawa, verified May 2026
- Round to two decimal places; mark anything not in the list below as an estimate

## Validated ingredient prices (May 2026, Ottawa)

Prices are from No Frills (nofrills.ca) unless noted. Use these exact rates when calculating costContribution values.

### Meat & poultry

| Ingredient | Size / format | Price | Rate used in recipes |
|---|---|---|---|
| Lean ground beef (Butcher's Choice) | 450 g pkg | $9.00 | **$20.00/kg** |
| Medium ground beef (Butcher's Choice) | 450 g pkg | $8.50 | **$19.00/kg** |
| Medium ground beef (club pack) | per kg | — | **$15.41/kg** |
| Ground turkey (Maple Leaf) | 454 g pkg | $8.00 | **$17.62/kg** ($8.00/pkg) |
| Ground chicken | 454 g pkg | $8.00 | **$17.62/kg** ($8.00/pkg) |
| Boneless skinless chicken thighs (Butcher's Choice club pack) | per kg | $8.82 | **$8.82/kg** |
| Boneless skinless chicken thighs (Maple Leaf) | per kg | $12.00 | **$12.00/kg** |

**Which rate to use:** Use the club-pack rate ($8.82/kg) for the cheapest option; use Maple Leaf ($12.00/kg) if the recipe notes a standard tray. Ground beef recipes should default to medium ($19/kg) unless the recipe specifically calls for lean ($20/kg).

### Canned goods

| Ingredient | Size | Price | Brand |
|---|---|---|---|
| Diced tomatoes | 796 mL | $2.00 | No Name |
| Crushed tomatoes | 796 mL | $2.00 | No Name |
| Whole/stewed tomatoes | 796 mL | $2.00 | No Name |
| Black beans | 540 mL | $1.50 | No Name |
| Red kidney beans | 540 mL | $1.50 | No Name |
| Chickpeas | 540 mL | $1.50 | No Name |
| White kidney beans | 540 mL | $1.50 | No Name |
| Corn kernels | 341 mL | $1.25 | No Name |
| Chicken broth | 900 mL | $1.50 | No Name |
| Beef broth | 900 mL | ~$1.50 | No Name (estimate — same shelf as chicken) |
| Coconut milk (full-fat) | 400 mL | $2.80 | Thai Kitchen |
| Tomato paste | 156 mL | ~$1.00 | No Name (estimate) |

### Produce

| Ingredient | Format | Price | Per-unit rate |
|---|---|---|---|
| Russet potatoes | 10 lb bag (Farmer's Market) | $1.99 | ~$0.44/kg |
| Yellow/white potatoes | 5 lb bag (PC) | $4.99–$5.49 | ~$2.20–2.42/kg |
| Yellow onions | 3 lb bag (Farmer's Market) | $3.49 | ~$2.57/kg; ~$1.23 each |
| Green onions | 1 bunch | $1.99 | — |
| Carrots | 3 lb bag (Farmer's Market) | $3.99 | ~$2.93/kg |
| Celery | 1 bunch | $2.99 | — |
| Garlic | 3-bulb bag | $0.99 | ~$0.33/bulb; ~$0.08/clove (4 cloves/bulb) |
| Green cabbage | whole head (~1 kg) | ~$2.99 | ~$2.99/kg |
| Sweet potatoes | each | ~$2.07 | — |

### Pantry & dry goods

| Ingredient | Size | Price | Per-unit rate |
|---|---|---|---|
| Long-grain white rice (No Name) | 2 kg | $5.00 | $2.50/kg; $0.25/100 g |
| Dry pasta, any shape (No Name) | 900 g | $2.00 | $0.22/100 g |
| Red split lentils (PC Blue Menu) | 900 g | $3.79 | $0.42/100 g |
| Red split lentils (Dunya Harvest) | 900 g | $3.19 | $0.35/100 g |
| Green lentils (PC Blue Menu) | 900 g | $3.79 | $0.42/100 g |
| Vegetable oil / canola oil (No Name) | 946 mL | $4.00 | $0.42/100 mL |
| Soy sauce (No Name) | 450 mL | $2.29 | $0.51/100 mL |

### Dairy & eggs

| Ingredient | Size | Price | Per-unit rate |
|---|---|---|---|
| Eggs, large (No Name) | 12-pack | $3.93 | $0.33/egg |
| Butter (No Name) | 454 g | $6.18 | $1.36/100 g |
| Butter (Lactantia) | 454 g | $7.99 | $1.76/100 g |

### Worked examples

```
300 g rice from 2 kg bag ($5.00):     $5.00 × (300 ÷ 2000) = $0.75
4 cloves garlic from 3-bulb bag ($0.99):   $0.99 ÷ 3 bulbs ÷ 4 cloves = $0.08/clove × 4 = $0.33
450 g chicken thighs at $8.82/kg:     $8.82 × 0.45 = $3.97
500 g lean ground beef at $20/kg:     $20.00 × 0.50 = $10.00
250 mL chicken broth from 900 mL ($1.50):  $1.50 × (250 ÷ 900) = $0.42
1 can diced tomatoes (796 mL):        $2.00 (fixed price)
1 can black beans (540 mL):           $1.50 (fixed price)
```

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

75 recipes as of May 2026.

## Git identity (this machine)

- user.name: Cl3b0rg
- user.email: Cl3b0rg@users.noreply.github.com
- These are set locally in the repo, not globally
