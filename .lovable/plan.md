## What you're seeing

Both numbers come from the **properties page unit row**, nothing is broken in the data:

```
{u.capacity} אורחים · ₪{u.base_price} / לילה
```

1. **"500" everywhere** — that isn't the actual base price. It's the *placeholder* text inside the empty "מחיר בסיס ללילה" input at the bottom of each property (the add-new-unit form). Your real prices are correct: ₪1,190, ₪1,890, ₪1,290 in the rows above.
2. **"5 לילה / 4 לילה / 9 לילה"** — that number is the unit **capacity (guests)**, not nights. Because the row mixes Hebrew (RTL) with `₪1,190 / לילה` (LTR-ish), the capacity digit ends up rendering visually adjacent to the word "לילה", so it reads like "4 nights". It's actually "4 אורחים" on one side and "₪1,190 / לילה" on the other.

## Fix (UI only, no backend changes)

In `src/routes/_authenticated/properties.tsx`, rewrite the unit row meta line so the two facts can't visually collide:

- Split capacity and price into two separate pill/spans with a clear divider, each wrapped in its own `dir` context:
  - `<span dir="rtl">{capacity} אורחים</span>`
  - `<span dir="ltr" class="ltr-num">₪{base_price} / לילה</span>`
- Wrap the whole meta line in `dir="rtl"` and use `gap-3` between the two spans instead of a `·` character, so RTL/LTR reordering can't glue the capacity number to "לילה".
- Change the price input placeholder from `"500"` to something neutral like `"0"` (or drop the placeholder and rely on the label) so empty forms don't imply every unit costs 500.

No changes to `data.functions.ts`, schema, or any other route.
