# commit-governance Specification

## Requirements

### Requirement: Branch commits must follow repository commit convention
Commits prepared for review or sharing MUST use English conventional commit messages.

#### Scenario: Preparing a local branch
Given a contributor is about to share a branch
When the branch contains unpublished commits
Then each commit message uses a conventional commit type prefix such as `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, or `test:`
And the summary text is written in English

### Requirement: Unpublished history must be normalized before sharing
If a local unpublished commit violates the commit convention, that branch history MUST be rewritten before the branch is shared further.

#### Scenario: Local history contains a non-conforming commit
Given a contributor notices an unpublished commit that does not follow the commit convention
When the branch is prepared for review or push
Then the contributor rewrites that unpublished commit message into a conforming conventional commit message first
