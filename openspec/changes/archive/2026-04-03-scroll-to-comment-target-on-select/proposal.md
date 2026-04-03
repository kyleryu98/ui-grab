## Why

When comment history grows, users can no longer tell which saved comment belongs to which element without manually searching the page. Clicking a comment row should take the user back to the referenced element so the relationship is immediately obvious.

## What Changes

- scroll the page to reveal the referenced element when a comment row is selected
- keep the existing edit prompt behavior after the target element has been revealed
- add focused regression coverage for offscreen comment targets

## Impact

- improves comment navigation and orientation for long pages
- preserves the current design system and edit-in-place workflow
