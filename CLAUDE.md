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
- Sources: No Frills (nofrills.ca) and Walmart Canada (walmart.ca), Ottawa, verified August 2026
- Round to two decimal places; mark anything not in the list below as an estimate
- **Whole-item vegetables:** If a recipe uses half a head of cabbage, half an onion, half a head of lettuce, or any similar partial-unit of a whole vegetable, price it at the full item cost — not the fractional portion. The consumer must purchase the whole item. This applies to: onions, cabbage heads, lettuce heads, and any other vegetable sold as a single whole unit. It does NOT apply to bunched items like celery or green onions, where individual stalks can be taken without deterioration.

### How to check live prices

nofrills.ca returns HTTP 403 to automated fetches and Reddit is fully blocked, so the reliable automated source is **Flipp's backend JSON API**, which returns live flyer prices for a given postal code:

```
https://backflipp.wishabi.com/flipp/items/search?q=ITEM&postal_code=K2J3R9
```

- `K2J3R9` is the owner's local postal code (Barrhaven, Ottawa). Swap the `q=` term per ingredient (URL-encode spaces as `%20`).
- Returns both e-commerce listings and weekly flyer items with store names — use the **weekly flyer** entries for sale comparisons.
- The r/ottawa "Weekly Grocery Review" threads are a good human-curated cross-check when accessible, but cannot be fetched directly.
- **Flyer prices are temporary SALES.** Do not rewrite recipe baselines to chase weekly sales — the validated table below is meant to hold regular/typical prices so recipes don't bounce over $15 when a sale ends. Only revise a baseline when an item is consistently cheaper across many chains over multiple weeks.

## Validated ingredient prices (August 2026, Ottawa)

Prices are from No Frills (nofrills.ca) unless noted. Use these exact rates when calculating costContribution values.

### Meat & poultry

Verified at Ottawa No Frills, May 23 2026. Re-confirmed against live Flipp flyer data (K2J3R9), August 2026: regular prices stable vs the July table; this week's sales (butter $4.67, pasta $0.88, No Frills ground chicken $3.88/454 g, cabbage $0.99/lb) not chased into baselines.

| Ingredient | Size / format | Price | Rate used in recipes |
|---|---|---|---|
| Lean ground beef (Butcher's Choice) | 450 g pkg | $9.00 | **$20.00/kg** |
| Medium ground beef (Butcher's Choice) | 450 g pkg | $8.50 | **$19.00/kg** |
| Medium ground beef (club pack) | per kg | — | **$15.41/kg** |
| Ground turkey (Maple Leaf / PC Blue Menu) | 454 g pkg | $9.00 | **$19.82/kg** ($9.00/pkg) |
| Ground chicken | 454 g pkg | $9.00 | **$19.82/kg** ($9.00/pkg) |
| Ground pork (lean, Butcher's Choice) | 450 g pkg | $4.49 | **$9.98/kg** ($4.49/pkg) |
| Ground pork (club pack) | per kg | — | **$11.00/kg** |
| **Bone-in skin-on chicken thighs (club pack)** | per kg | $8.82 | **$8.82/kg** — use for soups, stews, braises, adobo |
| Boneless skinless chicken thighs | per kg | $17.64 | **$17.64/kg** — expensive; avoid unless recipe requires it |
| Boneless skinless chicken breasts (PC Blue Menu) | per kg | $19.00 | **$19.00/kg** (confirmed) |
| Whole chicken (PC Air Chilled) | per kg | $8.80 | **$8.80/kg** |
| Pork chops, boneless centre (club pack) | per kg | $13.23 | **$13.23/kg** |
| Half pork loin (boneless) | per kg | $9.46 | **$9.46/kg** |
| Pork picnic shoulder | per kg | $7.72 | **$7.72/kg** — very cheap for stews |

**Critical note on chicken thighs:** $8.82/kg is bone-in, skin-on. Recipes that simmer, braise, or make soup should use bone-in thighs — the meat pulls off the bone easily. Boneless skinless ($17.64/kg) is rarely affordable enough for a recipe that stays under $15. Default to bone-in for any soup, stew, or braise. For dishes where boneless pieces are genuinely required (stir-fry, teriyaki), use chicken breast at $19.00/kg (PC Blue Menu, confirmed) and keep quantity to 400 g or less.

**Which ground beef rate to use:** Default to medium ($19/kg). Use lean ($20/kg) only if the recipe specifically needs it.

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
| Chicken broth | 900 mL | $1.69 | Campbell's — cheapest; No Name is $1.79 |
| Beef broth | 900 mL | $1.69 | Campbell's — same price as chicken broth |
| Coconut milk (full-fat) | 400 mL | $2.97 | Thai Kitchen (Walmart); cheaper alternatives: Chaokoh/Aroy-D $2.47, Grace $1.94 |
| Tomato paste | 156 mL | ~$1.00 | No Name (estimate) |

### Produce

| Ingredient | Format | Price | Per-unit rate |
|---|---|---|---|
| Russet potatoes | 10 lb bag (Farmer's Market) | $2.99 | $0.66/kg |
| Yellow/white potatoes | 5 lb bag (PC) | $4.99–$5.49 | ~$2.20–2.42/kg |
| Yellow onions | 3 lb bag (Farmer's Market) | $2.99 | $2.20/kg; ~$1.07 each |
| Green onions | 1 bunch | $1.99 | — |
| Carrots | 3 lb bag (Farmer's Market) | $3.99 | ~$2.93/kg |
| Celery | 1 bunch | $2.99 | — |
| Garlic | 3-bulb bag | $0.99 | ~$0.33/bulb; ~$0.08/clove (4 cloves/bulb) |
| Green cabbage | whole head (~1 kg) | ~$2.18 | $0.99/lb (~$2.18/kg); price as full head regardless of quantity used |
| Romaine lettuce | 1 head | ~$3.47 | $3.47/head (Walmart); price as full head regardless of quantity used |
| Sweet potatoes | loose | ~$5.49/kg (~$2.49/lb) | — |
| No Name Naturally Imperfect Carrots | 2270 g bag | $4.00 | $1.76/kg (budget carrot option) |

### Pantry & dry goods

| Ingredient | Size | Price | Per-unit rate |
|---|---|---|---|
| Long-grain white rice (No Name) | 2 kg | $5.00 | $2.50/kg; $0.25/100 g |
| Dry pasta, any shape (No Name) | 900 g | $2.00 | $0.22/100 g |
| Red split lentils (PC Blue Menu) | 900 g | $3.79 | $0.42/100 g |
| Red split lentils (Dunya Harvest) | 900 g | $3.19 | $0.35/100 g |
| Red split lentils (Great Value) | 900 g | $2.97 | $0.33/100 g — cheapest option (Walmart) |
| Red split lentils club size (PC Blue Menu) | 2 kg | $5.00 | $0.25/100 g |
| Green lentils (PC Blue Menu) | 900 g | $3.79 | $0.42/100 g |
| Vegetable oil / canola oil (No Name) | 946 mL | $4.00 | $0.42/100 mL |
| Soy sauce (No Name) | 450 mL | $2.29 | $0.51/100 mL |
| All-purpose flour (No Name) | 10 kg | $10.00 | $0.10/100 g ($1.00/kg) |
| Quick / rolled oats (Great Value) | 1 kg | $2.77 | $0.28/100 g |
| Peanut butter, smooth (Great Value) | 1 kg | $4.27 | $0.43/100 g |
| Table syrup (No Name) | 500 mL | ~$3.00 | ~$0.60/100 mL (estimate) |

### Bakery, frozen & milk

| Ingredient | Size / format | Price | Per-unit rate |
|---|---|---|---|
| White sandwich bread (Great Value) | ~675 g loaf (~20 slices) | $2.48 | ~$0.12/slice |
| Milk, 2% (Sealtest) | 2 L container | $5.48 | $2.74/L; $0.27/100 mL |
| Frozen mixed vegetables (Great Value) | ~750 g bag | $3.37 | $0.45/100 g; value 2 kg bag $6.97 = $0.35/100 g |
| Bananas | loose | ~$0.69/lb ($1.52/kg) | ~$0.25 each (estimate) |

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
250 mL chicken broth from 900 mL ($1.69):  $1.69 × (250 ÷ 900) = $0.47
1 can diced tomatoes (796 mL):        $2.00 (fixed price)
1 can black beans (540 mL):           $1.50 (fixed price)
1 kg russet potatoes from 10 lb bag ($2.99): $2.99 × (1000 ÷ 4536) = $0.66
250 mL milk from 2 L container ($5.48):   $5.48 × (250 ÷ 2000) = $0.69
0.5 head green cabbage (whole item rule):  $2.18 (full head — do not halve)
1 whole onion:                         $1.07 (from 3 lb bag at $2.99/bag)
0.5 onion (whole item rule):           $1.07 (full onion — do not halve)
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
- Three Google Fonts: **Zilla Slab** (headlines, titles, manifesto), **IBM Plex Sans** (body copy, steps), **IBM Plex Mono** (all prices, labels, kickers, tags, the receipt — the "ledger" device)
- Loaded via Google Fonts CDN with `display=swap`
- Tag filter bar on index page (vanilla JS, no dependencies)
- Mobile-first, accessible, semantic HTML

## Current recipe count

101 recipes as of August 2026.

## Git identity (this machine)

- user.name: Cl3b0rg
- user.email: Cl3b0rg@users.noreply.github.com
- These are set locally in the repo, not globally
