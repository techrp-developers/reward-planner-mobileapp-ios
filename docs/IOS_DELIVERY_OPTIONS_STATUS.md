# iOS delivery options: implementation and activation status

## Current status

Standard (`cheapest`) / Quick (`fastest`) delivery selection is **enabled at runtime**. The static `DELIVERY_SELECTION_SUPPORTED` flag was removed (2026-11-05).

- The app always sends `delivery_preference` on the checkout preview (`GET get-cart` / `get-buy-now`).
- If the preview returns a non-empty `deliveryChoices`, the radio cards are shown, the quote must match the selected choice (`matchesDeliveryQuote`), and the order POST carries `delivery_preference`.
- If the preview returns no `deliveryChoices` (backend without courier selection), checkout falls back to the default-courier quote (`isLegacyCheckoutQuoteValid`) and the order POST omits `delivery_preference`.

The backend contract was verified on the dashboard repo's `origin/dev-code` branch (also present on `sahil-test`, `sakshi-new-code`, `temporary`). It is **not** on `main` or `sahil-code`. Which branch the live server runs could not be confirmed from outside (auth is checked before validation). Either way the app keeps working; Quick Delivery only appears once the live server returns `deliveryChoices`.

## Exact application files changed

| File | Changes |
| --- | --- |
| `src/modules/ecommerce/api/CheckoutApi.tsx` | Merged duplicate implementations discovered during this task. Preserved existing endpoints, Axios authentication, empty-cart normalization, payload forwarding and positional arguments. Sends `delivery_preference` when a preference is passed; omitted preferences preserve the existing wire contract. Preserved campaign/content fields present in the appended reference and verified in the available dashboard backend controller. Exports delivery display types. |
| `src/modules/ecommerce/utils/checkoutDelivery.ts` | New delivery types, runtime `isCheckoutQuoteValid()` (choice-matched quote when the server returns choices, default-courier quote otherwise), choice validation, availability filtering, duplicate removal, and selected-quote price checks. Does not fabricate missing choices, prices or couriers. |
| `src/modules/ecommerce/components/checkout/DeliveryOptions.tsx` | New purple radio-card section, theme support, quoted prices/estimates, optional courier/service information, loading feedback and unsupported/unavailable messages. |
| `src/modules/ecommerce/components/checkout/OrderStepUI.tsx` | Standard preference state, parsed server choices, fallback from unavailable Quick to Standard, selected-address requests, isolated quote keys, no previous-query price placeholders, valid legacy default-courier placement independent of optional selection support, fresh quote validation, changed-price review, item-mutation guards, reward/address edit locks during placement, and Razorpay amount consistency check. Existing payment verification, polling, cancellation, restoration and navigation remain in place. Clears all scoped cart previews after cart removal. |
| `src/modules/ecommerce/components/checkout/OrderProcedbutton.tsx` | Disabled Place Order now renders at 0.45 opacity (was 0.8, indistinguishable from enabled) and exposes button role/disabled/busy state. |
| `src/modules/ecommerce/components/checkout/CheckoutItemCart.tsx` | Removed today-plus-five-days fallback. Uses backend EDD or a translated neutral message. Localizes date formatting; preserves images, prices, policies and controls. |
| `src/modules/ecommerce/navigation/navigationPerformance.ts` | Quotes distinguish delivery preference, address and content context in addition to existing mode/product/variant/campaign/quantity/rewards. Existing invalidation prefixes still match scoped quotes. Content context survives prefetch. |
| `src/modules/ecommerce/navigation/types.ts` | Optional checkout `content_id`, consistent with the inspected backend's existing buy-now context. |
| `src/modules/ecommerce/hooks/useCheckoutFlow.ts` | Preserves content context on the existing buy-now preview path, while retaining existing call arguments when absent. |
| `src/i18n/locales/en/products.json` | Delivery-option, availability, estimate, quote-change and shipping-label translations. |
| `src/i18n/locales/hi/products.json` | Matching Hindi translations. |
| `src/i18n/locales/mr/products.json` | Matching Marathi translations. |

New tests: `__tests__/checkoutDelivery.test.ts`, `__tests__/deliveryOptions.test.tsx`, `__tests__/checkoutDeliverySafety.test.tsx`, `__tests__/checkoutApiContract.test.ts`.

Handoff document: `docs/IOS_DELIVERY_OPTIONS_STATUS.md`.

Inspected without changing: both address/cart screens (`WithAddress.tsx`, `WithoutAddress.tsx`), the address-cart `CheckoutSummary.tsx`, `BillDetailsCard.tsx`, `CartItemCard.tsx`, checkout navigation, payment utilities, and both available backend checkout controller/model copies.

No native iOS files were changed by this implementation. The pre-existing `ios/RewardsPlanners.xcodeproj/project.pbxproj` working-tree change belongs to the user's workspace and was preserved.


## Verified backend contract (`origin/dev-code`)

- `GET /v1/checkout/get-cart` and `GET /v1/checkout/get-buy-now`: query `delivery_preference` ∈ `cheapest|fastest` (absent = cheapest; any other value → 400 `Invalid delivery_preference`).
- `POST /v1/checkout/cart` and `POST /v1/checkout/buy-now`: body `delivery_preference` (express-validator `isIn(['cheapest','fastest'])`, optional).
- Preview response adds `deliveryChoices[]` from `services/courier/courierPolicy.buildDeliveryChoices()`: `{ preference, label, shipping_total, payable_amount, delivery_days, estimated_delivery_date }`. `fastest` is included only when it arrives strictly sooner than `cheapest`. `payable_amount` = product total − redeemed coins + that choice's shipping, matching the summary `payableAmount` for the selected preference.
- `shippingTotal`/`payableAmount` in the preview already reflect the requested preference (per-vendor `selectCourierForPreference`).
- No separate partner-ID selection exists; courier/partner names are not part of `deliveryChoices`.
- `main` validators are not strict, so an unknown `delivery_preference` is ignored there.

## Backend follow-ups

1. Deploy `dev-code` checkout changes to the live server (or confirm they are already live) — required for Quick Delivery to appear.
2. `getCheckoutCart` still falls back to `now + 5 days` when a courier gives no EDD (`checkoutModel.js`, cart branch). The app cannot tell this from a real date.
3. `estimated_delivery_date` in `deliveryChoices` is computed from `delivery_days`, not the courier's own date.

## Validation (2026-11-05)

- `tsc --noEmit`: 0 errors.
- Checkout suites (`checkoutDelivery`, `checkoutApiContract`, `checkoutDeliverySafety`, `deliveryOptions`): 50/50 pass, including cart and buy-now Quick Delivery repricing → order with `delivery_preference: 'fastest'` and Razorpay amount 17500, and Standard-only fallback.
- ESLint on changed files: 0 errors (pre-existing inline-style/no-void warnings only).
- Full Jest: unrelated suites (`iosPushNotifications`, `launchPromoSplash`, `homeBanners`, `notificationSettingsScreen`) fail with and without these changes.

Still unverified: live Standard/Quick rates on a real PIN code, Quick unavailable on a real PIN code, Razorpay success/failure/cancel on device, and iOS simulator rendering.
