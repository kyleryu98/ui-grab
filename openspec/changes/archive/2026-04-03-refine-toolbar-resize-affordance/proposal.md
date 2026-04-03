# Proposal

## Summary

Refine the toolbar resize affordance so it feels native to the glass toolbar: hidden by default, revealed on hover, centered on the toolbar's free side, and represented by a scale-aware axis resize icon.

## Why

The current resize handle reads like a detached floating control. It is always visible, its icon does not clearly communicate resizing, and its size does not scale with the toolbar. That makes the affordance feel disconnected from the rest of the glass system and weakens discoverability.

## Scope

- Replace the current resize icon with an axis resize glyph that reads clearly as a size control.
- Scale the resize affordance together with the toolbar so the control keeps its visual weight at larger sizes.
- Reveal the resize affordance only when the expanded toolbar is hovered, while keeping it available during active resizing and while the pointer moves from the toolbar body into the handle.
- Reposition and restyle the affordance so it sits on the free side center of the toolbar shell and uses a liquid-glass chip treatment.
- Show resize guidance above the handle without overlapping the control.
- Update toolbar regression coverage for hover reveal, center alignment, tooltip placement, and resize persistence.

## Out of Scope

- Redesigning the toolbar action buttons themselves.
- Changing toolbar resize math or persistence behavior beyond what is needed to support the hover affordance.
