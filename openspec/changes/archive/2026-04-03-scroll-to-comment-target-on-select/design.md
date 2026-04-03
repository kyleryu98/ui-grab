## Overview

Comment rows already resolve back to live DOM elements through the stored selector map. The missing behavior is viewport navigation before prompt mode is re-entered.

## Design

1. Resolve the first connected element for the selected comment item.
2. Scroll that element into a comfortable visible area before entering prompt mode.
3. Recompute bounds after scrolling and re-open prompt mode using the updated center point.

## Notes

- The row click behavior should still open prompt mode with the previous comment text.
- The scroll should use a centered alignment so the target does not sit under the floating toolbar.
- Tests should use an offscreen target to verify actual viewport movement, not just prompt mode state.
