# Design

## Bulk actions

The toolbar keeps a single comments entry point. When comment history exists, the comments panel becomes the only place that exposes bulk operations. This removes the ambiguous extra toolbar icon and keeps the action scope visually tied to the history it affects.

The comments panel header uses two explicit actions:

- `All Copy` for exporting every saved comment snippet.
- `Clear` for clearing saved history and preserving the existing confirmation flow.

## Per-item actions

Each comment row exposes `Copy` and `Delete` affordances inside the panel so users can act on one saved item without relying on implicit click behavior alone. Hover and keyboard focus keep the current preview/highlight behavior intact.

## Editing flow

Editing an existing comment needs to mutate the saved history item instead of creating a new one. To support that:

1. Selecting a comment row sets an active comment item id in the core runtime.
2. Pressing `Enter` on the selected row opens prompt mode with the saved message prefilled.
3. Submitting prompt mode while an active comment item id exists updates the existing item content, comment text, timestamp, and clipboard payload rather than appending a new item.

This keeps the existing selection-label prompt surface and design system, while making edit intent explicit and reversible through the same UI pattern users already know.
