# Linear task orchestration

## Root command

When a Sol root task receives `按项目规范执行当前 Linear 任务。`, it executes exactly one current child Issue using this contract.

## Startup and authority

Read `AGENTS.md`, `context/project.md`, `context/status.md`, `context/codex-rules.md`, this document, the relevant specification and integration documents, then inspect the branch and working tree. Live Linear owns task state, parent/child identity and relations. Repository documents own durable engineering, product, security and acceptance rules. A material conflict stops execution.

## Parent and child selection

Query live Linear for In Progress Issues in this product project. A parent candidate has no parent, belongs to the declared execution sequence and has every live `blockedBy` relation Done. Select the unique eligible active parent whose earlier sequence parents are Done. Never infer the parent from the current branch or recent chat.

List the selected parent's direct children. If exactly one is In Progress, select it. If multiple are In Progress, stop for WIP conflict. If none is In Progress, read the explicit parent order and select the first nonterminal child whose live blockers and earlier required siblings are Done. Verify its `parentId` equals the parent. Do not leapfrog blocked work.

Read the full parent, selected child, direct dependencies/relations, referenced documents and affected code/tests. Completed Issues are dependency evidence only; do not reopen, rename, rebuild or re-audit them.

## Execution and agent ownership

Sol owns scope, routing, writer locks, review and stop decisions, and is the default writer. Use Terra only for a bounded judgment-heavy implementation and Luna only for deterministic mechanical work. Delegation must reduce risk or duplicated context. At most one writer owns a core module; child agents do not spawn agents. `max_depth` remains 1. Terra Reviewer is independent and read-only; fixes return to the original writer.

Use independent review for Auth/authorization/RLS, migrations/destructive data, Billing/Credit/Payment/idempotency, secrets, provider/deployment boundaries, shared public APIs or broad refactors. Low-risk isolated work may use Sol self-review.

Implement the smallest complete product-local change or, when shared reuse is explicit, the smallest durable provider/product-neutral capability boundary. Run targeted checks while editing, then one full repository verification after fixes settle. Record every required unrun check as `not_run` with reason and risk.

## Linear writeback and one-Issue stop

Sol may move only the selected child to In Progress, In Review or Done when its real gates are met, and may add safe progress/review comments. Sol may correct an explicit omission in the active child without changing its identity, parent, order or intent. Never automatically close the parent, change the next child, create/rename Issues or start another Issue. Stop when the selected child is accepted or blocked.

## GitHub and production gates

After local verification and required independent review, a focused task commit, non-force push, one PR to `main`, required CI wait and normal reviewed merge are allowed only when current project/user authority permits them. Never force-push, bypass review, self-approve or mix unrelated changes.

Tag/release creation, manual deployment/redeployment, environment changes, production database migrations/data mutation, dashboard-only schema changes, live secrets, live Payment/refund and chargeable providers require separate explicit approval naming the operation and target. An automatic deployment caused by an approved merge may be inspected read-only. Linear comments and final reports never expose secret values or private data.

## Final report

Report the selected parent/child relation, outcome and user-visible change; reusable foundation effect; files/modules changed; verification and independent review; Git/PR/merge/deployment/Linear state; `not_run` items and risk; and the one-Issue stop. Never claim a gate without fresh evidence.
