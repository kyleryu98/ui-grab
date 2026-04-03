# Proposal

## Summary

Refine the comments workflow so bulk actions live inside the comments panel, per-comment copy/delete actions are directly available, and existing comment messages can be edited without creating duplicate history entries.

## Why

The current toolbar exposes a second icon for copy-all that is not self-explanatory, while the comments panel itself does not expose enough direct actions per item. Re-editing a saved comment currently routes through prompt mode in a way that creates a new history item instead of updating the existing one, which makes the interaction feel indirect.

## Scope

- Remove the dedicated toolbar `Copy All` control and keep bulk actions inside the comments panel.
- Rework the comments panel header so `All Copy` and `Clear` are the primary bulk actions.
- Add per-comment `Copy` and `Delete` actions.
- Support editing an existing comment message from the comments list and persisting it as an update.
- Update focused automated coverage for the new toolbar and comments interactions.

## Out of Scope

- Redesigning the broader toolbar visual language.
- Changing the underlying clipboard payload format beyond what is required to reflect updated comment text.
