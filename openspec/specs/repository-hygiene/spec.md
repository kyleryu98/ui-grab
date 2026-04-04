# repository-hygiene Specification

## Requirements

### Requirement: Repository control files stay committed
Repository-wide control files that define shared behavior MUST remain versioned.

#### Scenario: Evaluating repository policy files
Given a contributor reviews files such as `.gitignore`
When the file defines behavior that every checkout should share
Then the file remains committed in the repository

### Requirement: Canonical OpenSpec specs stay committed
The canonical governance documents under `openspec/specs/**` MUST remain versioned so repository rules are shared.

#### Scenario: Updating repository governance
Given a contributor needs to change a repository-wide rule
When they write the durable rule
Then they update a file under `openspec/specs/**`
And they do not rely on local-only change artifacts to carry the rule

### Requirement: OpenSpec workflow artifacts stay local
Proposal, design, tasks, and archived change artifacts under `openspec/changes/**` MUST NOT be committed or pushed.

#### Scenario: Preparing changes for push
Given a contributor is preparing a branch for review or push
When they inspect staged or tracked files
Then no path under `openspec/changes/**` is tracked in git
And `.gitignore` blocks those paths from being added accidentally
