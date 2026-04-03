# Design

## Visual Thesis

The resize affordance should read as a quiet extension of the toolbar shell, not a detached utility badge. It should stay out of the way at rest, surface with a smooth liquid-glass feel on intent, and scale proportionally with the toolbar.

## Decision

Use a hover-revealed chip centered on the toolbar's free side.

- The chip is anchored on the free side center of the toolbar so it reads as a clear resize handle without competing with the action buttons.
- The chip stays hidden on hover-capable devices until the toolbar itself is hovered.
- A transparent bridge hitbox spans the gap between the shell and the chip so hover state remains stable as the pointer moves into the control.
- While the user is actively resizing, the chip remains visible even if the pointer leaves the shell bounds.
- The icon scales with the toolbar and rotates for vertical edges so the affordance remains legible across snap positions.
- A guidance tooltip renders beyond the handle, away from the toolbar, so it never overlaps the control.

## Interaction

- Idle state: no visible resize control on hover-capable pointer devices.
- Hover state: the center-side chip fades in with the same glass material language as the toolbar buttons.
- Handle hover: the chip remains revealed and shows a compact resize tooltip away from the shell.
- Resize state: the chip stays visible and interactive until pointer release.
- Non-hover environments keep the resize chip visible so resize remains discoverable.

## Consequences

- The toolbar looks cleaner when not being manipulated.
- Resize remains discoverable without looking like a replacement or swap action.
- The affordance stays usable even when the toolbar is scaled up.
- Existing resize persistence and proportional drag behavior remain intact.
