# readme-governance Specification

## Purpose
Define the boundary between user-facing README content and maintainer-only operational documentation.
## Requirements
### Requirement: README stays user-facing

The root `README.md` and the packaged `packages/grab/README.md` copy MUST stay focused on end-user documentation and MUST describe installation and first-use flows accurately.

#### Scenario: install instructions are documented

Given a maintainer updates the README install section
When the document includes both guided CLI setup and manual dependency installation
Then those paths are labeled separately
And the README does not imply that users must perform both paths to start using `ui-grab`.

#### Scenario: quick start instructions are documented

Given a maintainer updates the README quick start section
When the section describes activation and selection
Then the documented steps match the implemented runtime flow for activation and copying
And the instructions do not describe a shortcut as directly copying when it actually activates the picker first.

### Requirement: Maintainer operations stay out of README

Maintainer-only operational guidance MUST NOT be placed in the root README or packaged README copy.

#### Scenario: release instructions are documented

Given maintainers need to document publishing or release operations
When the instructions involve npm trusted publishing, token hardening, release-only dry runs, or administrative workflow setup
Then that guidance is placed in maintainer documentation such as `CONTRIBUTING.md`
And it is not added to `README.md` or `packages/grab/README.md`.

### Requirement: Packaged README matches the root README

The published `ui-grab` package README MUST match the root README content that users see in the repository.

#### Scenario: root README changes

Given the root README is updated
When the packaged README copy is refreshed
Then `packages/grab/README.md` matches the user-facing content of the root `README.md`.

