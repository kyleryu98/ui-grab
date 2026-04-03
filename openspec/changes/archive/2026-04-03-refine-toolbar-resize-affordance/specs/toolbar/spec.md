# toolbar Specification

## Purpose

Define how the toolbar resize affordance is presented.

## Requirements

### Requirement: Hover-capable toolbars reveal resize affordance on intent

Expanded toolbars on hover-capable devices MUST keep the resize affordance hidden until the toolbar is hovered.

#### Scenario: Bottom toolbar is idle

Given the toolbar is expanded on a hover-capable device
When the pointer is not over the toolbar
Then the resize affordance is visually hidden and does not intercept pointer input.

#### Scenario: Bottom toolbar is hovered

Given the toolbar is expanded on a hover-capable device
When the pointer moves over the toolbar
Then the resize affordance becomes visible at the free side center
And the resize affordance can be dragged to resize the toolbar.

#### Scenario: Pointer moves into the handle

Given the resize affordance is visible on a hover-capable device
When the pointer moves from the toolbar body into the resize handle
Then the resize affordance remains visible
And the pointer can continue into the handle without losing the hover affordance.

### Requirement: Resize affordance matches toolbar visual system

The toolbar resize affordance MUST use the same glass material language as the toolbar instead of appearing as a detached utility control.

#### Scenario: Resize affordance is shown

Given the resize affordance is visible
When it renders on the toolbar free side center
Then it uses a glass chip treatment consistent with the toolbar controls
And it uses a resize icon that clearly communicates resizing.

### Requirement: Resize affordance scales and guides clearly

The toolbar resize affordance MUST scale with the toolbar and keep its guidance outside the control.

#### Scenario: Toolbar is enlarged

Given the toolbar has been resized larger than its default dimensions
When the resize affordance is shown
Then the resize chip scales with the toolbar
And the icon remains visually centered inside the chip.

#### Scenario: Bottom toolbar handle is hovered

Given the toolbar is snapped to the bottom edge
When the resize handle is hovered
Then the resize tooltip appears above the handle
And the tooltip does not overlap the handle.
