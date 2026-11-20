# Web rules: UI and forms (apps/web)

## Components
- Function components + hooks. Props typed.
- Server state lives in Query; local UI state in `useState`. No global store unless shared client-only state really appears.
- Shared UI in `src/components/ui/` (shadcn/ui, ignored by Biome). Don't edit generated shadcn files beyond styling.

## Forms
- TanStack Form + Zod. The schema lives in the feature's `schemas.ts`.
- Zod does light checks only: required, email shape, password length ≥ 8, password confirmation matches. Laravel stays the source of truth (unique email, username format, wrong password).
- A 422 `ApiError` puts each `errors[field][0]` next to the matching field. A message with no field shows above the form.
- Disable the submit button while the mutation is pending.

## Messages and time
- Message bodies render as text (React escapes it). Links are detected and wrapped in `<a rel="noopener noreferrer" target="_blank">`. Never `dangerouslySetInnerHTML`.
- Times arrive as ISO UTC; format with `Intl.DateTimeFormat` in the browser's locale.

## Style
- Tailwind v4 utility classes; design tokens as CSS variables in `src/styles.css`; dark mode supported.

## Accessibility
- Every input has a label. Buttons are `<button>`. Focus is visible.
- Field errors are linked with `aria-describedby` and `aria-invalid`.
- The chat log uses `aria-live="polite"`.
