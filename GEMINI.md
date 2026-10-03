# School ERP — Codebase Memory & Architectural Guide

See full details in [AGENTS.md](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/AGENTS.md).

## Core Directive: Permanent Memory Space
- All architecture, entities, DTOs, services, controllers, endpoints, and multi-tenant security mechanisms are retained in memory via [AGENTS.md](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/AGENTS.md) and [.agents/rules/codebase_memory.md](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/.agents/rules/codebase_memory.md).
- **NEVER scan the entire codebase** with `find`, directory crawls, or mass greps.
- **INCREMENTAL UPDATE PROTOCOL**: Whenever any code is changed, added, or deleted in `school_erp`, update [AGENTS.md](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/AGENTS.md) and [.agents/rules/codebase_memory.md](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/.agents/rules/codebase_memory.md) immediately so the memory space remains up to date.
