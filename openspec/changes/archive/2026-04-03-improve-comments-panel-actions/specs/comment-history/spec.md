# comment-history Specification

## Purpose

Define how saved comment history actions and editing behave.

## Requirements

### Requirement: Bulk comment actions live inside the comments panel

Saved comment history MUST expose bulk copy and clear actions from the comments panel instead of a separate toolbar copy-all control.

#### Scenario: Opening comment history

Given comment history contains at least one saved item
When the user opens the comments panel
Then the panel header shows an `All Copy` action
And the panel header shows a `Clear` action
And the toolbar does not show a separate copy-all button.

### Requirement: Each saved comment exposes direct item actions

Each saved comment MUST expose direct actions for copying and deleting that item.

#### Scenario: Hovering a saved comment row

Given the comments panel is open
When the user hovers or focuses a saved comment row
Then the row reveals direct `Copy` and `Delete` actions for that item.

### Requirement: Editing a saved comment updates it in place

Saved comment message edits MUST update the existing history item instead of appending a duplicate.

#### Scenario: Editing a saved comment message from the list

Given the comments panel is open
And a saved comment row is selected
When the user presses `Enter`
And updates the saved message
And submits the prompt
Then the existing history item keeps its identity
And its saved message is updated
And the comments list still contains the same number of items.
