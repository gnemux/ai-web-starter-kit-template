# Project agent entry

Before changes, read `context/project.md`, `context/status.md`, `context/codex-rules.md`, the relevant `specs/` and `integrations/` documents, and `specs/collaboration/agent-orchestration.md` for Linear task execution.

Keep product code in `apps/web/modules/product`, thin product pages below the
configured `apps/web/app/(product)/<workspace-root>`, application/provider
adapters in `apps/web/modules/platform`, and provider-free
contracts/components in `packages/*`. Keep foundation tests protected under
`tests/foundation` and product journeys under `tests/product`. Use one writer
per core module. Run the repository checks before publication.

When asked `按项目规范执行当前 Linear 任务。`, select and complete exactly one executable child Issue, follow all operation gates, write safe Linear progress, and stop without closing its parent or entering the next child.
