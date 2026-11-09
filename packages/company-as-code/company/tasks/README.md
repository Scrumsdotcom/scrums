# /company/tasks

Canonical tasks. Most tasks live in their owning module's tracker; this directory holds cross-cutting tasks and a registry of long-lived task IDs.

Tasks are state machines. Canonical states:

```
backlog → planned → active → blocked? → review → completed
                                              ↘ archived
                                              ↘ failed
```

Validate against [`/schemas/task.schema.json`](../../schemas/task.schema.json).
