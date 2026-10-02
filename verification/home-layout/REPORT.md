# Home layout verification — 2 October 2026

Final acceptance status: **NOT YET PASS — authenticated Home visual checks are blocked.**

## Actual app run

- iPhone 15 simulator, iOS 17.4; UDID `D2358BF4-6F88-4178-B6FF-C68838C7F7CB`.
- Screen: 393 × 852 layout points, 1179 × 2556 screenshot pixels, scale 3.
- Current native Debug build completed with `BUILD SUCCEEDED` using the existing workspace/scheme and an isolated temporary DerivedData directory.
- Installed and launched `com.mpstech.rewardsplanners`; Metro connected to the running app.
- Inspected `simulator-current-app.png`: the app reaches sign-in. It is **not a Home screenshot**. Authentication was not bypassed.
- Opened Simulator for test-account sign-in. The last successful capture remains in the mobile-number sign-in flow. A later screenshot attempt failed; a read-only check then showed no booted simulator. No authenticated Home capture was obtained. No accessible physical device was connected.
- No reference screenshots were found in the supplied attachments.

## Existing live CMS responses

Read-only requests used the same public resolved endpoints as the app:

- `/content/resolved/product`: `navbar_background`, `promotional_banner` and `offers_banner` are null; `brand_promotional_banner` is absent.
- `/content/resolved/navbar`: every module's navbar entry is null.

Consequently, the actual CMS artwork cannot currently be verified. An existing environment with published banners is needed. No CMS, database, upload API or resolved API was changed.

## Small polish change

`CmsBannerGallery.tsx` now derives swipe height from the visible slides instead of reserving the tallest image in the entire carousel. This avoids a distant tall image creating unnecessary empty space during unrelated swipes. At rest, height follows the active slide. Per-slide ratios, zone fallbacks, independent state and all four display modes are retained.

Horizontal scroll handling does constant-size arithmetic; state returns its previous value when the visible slide indices are unchanged. Image metadata requests remain cached and shared by URL.

## Verification evidence

- **16 tests passed** across `homeBanners.test.tsx`, `homeBannerOrder.test.tsx`, and `offersIndependence.test.tsx`.
- Component checks cover widths 360, 375, 390 and 412, actual image ratios, mixed-ratio carousels, single/grid_2/grid_3, parent-width changes, independent zone fallbacks, header background bounds, and Home section ordering.
- New regression checks cover distant tall carousel slides and CMS offers rendering while flash-sale products are loading, empty or failed.
- The polished component compiles through the React Native Babel preset; `git diff --check` passes.
- TypeScript reports only the same five existing authentication errors in `useExistenceCheck.ts`, auth navigation types, `LocationAccessScreen.tsx` and `OnboardingScreen.tsx`. No unrelated authentication changes were made.
- Build output contains dependency/compiler/deployment-target warnings. Unit tests also report the existing `InteractionManager` deprecation. Home runtime warnings could not be assessed because the authenticated screen is not accessible.

## Acceptance checks still pending

| Requested check | Result |
| --- | --- |
| Complete authenticated Home screenshot | Blocked by sign-in |
| Navbar/promotion seam, gaps and content alignment | Code/component checks pass; actual Home visual result unverified |
| Search, labels, underline and notch safe area | Actual Home visual result unverified |
| Actual promotional artwork and CTA fully visible | Blocked by absent published CMS content |
| All four display modes on the actual device | Component tests pass; device checks pending |
| Mixed-ratio swipes without overlap/clipping/blank space | Component tests pass; native gesture checks pending |
| Brand and offers independence | Source and component checks pass; device checks pending |
| Vertical scrolling and collapsing header | Wiring checked; native gesture checks pending |
| Image-loading layout jump | Unverified; unknown dimensions still allow an initial fallback-to-actual height adjustment |
| Reference screenshot comparison | References unavailable |

No speculative loading-animation or ratio rewrite was made. The existing CMS response contains no usable image dimensions in the returned null zones. Cached dimensions are used when known; otherwise the existing zone fallback ratios are retained until actual metadata is available. A visible cold-load adjustment cannot honestly be ruled out without published artwork and access to Home.

## Files changed during this pass

- `src/modules/ecommerce/components/home/CmsBannerGallery.tsx`
- `__tests__/homeBanners.test.tsx`
- `__tests__/offersIndependence.test.tsx` (new)
- `verification/home-layout/REPORT.md` (new)
- `verification/home-layout/simulator-current-app.png` (new)

Build and Metro logs are in `/tmp/reward-home-verification-build.log` and `/tmp/reward-home-metro.log`; TypeScript output is in `/tmp/reward-home-polish-tsc.log`.
