# Security and Design Notes

This is a static education app, so the main risks are data integrity, stale remote state, and deployment defaults rather than credential handling.

## Fixed Risks

- Remote data trust: NASA archive rows are now validated before being converted into UI records.
- Unbounded data growth: live and snapshot fetches are capped at 80 rows.
- Runtime-only availability: a committed NASA snapshot keeps the atlas useful when live requests fail.
- Stale async updates: live fetches use `AbortController` and ignore replaced requests.
- Missing security headers: `public/_headers` adds CSP, frame protection, content sniffing protection, referrer policy, and a restrictive permissions policy.
- Weak citation granularity: evidence items now link directly to the source record instead of only the selected world page.

## Remaining Watch Items

- Scientific interpretation still needs human review before classroom or competition use.
- The NASA Exoplanet Archive schema can change, so the weekly snapshot workflow should be monitored.
- External source pages are trusted by link only; the app does not embed third-party scripts or images.
- Accessibility should be tested with keyboard-only navigation and a screen reader before broad release.
