---
name: ha-device-debug
description: "Use when debugging Home Assistant devices, unavailable or stale entities, incorrect dashboards, renamed entities, integration errors or missing telemetry."
---

# Device debugging

Use [API diagnostics](../../../scripts/ha-inspect.mjs) with the existing `HA_URL`/`HA_TOKEN` environment.
See [operations](../../../docs/operations.md) for arguments and SSH details.

1. Identify the raw entity, registry platform, model, unique ID, config entry and disable reason. Don't infer ownership from its name.
2. Check the integration's entry state. Compare a working device on the same integration before blaming individual devices.
3. Check raw states and device last-seen, then derived templates/dashboard/automations. Startup timestamps aren't proof of device communication.
4. Inspect relevant timestamp-bounded errors and selected diagnostic fields. Don't dump raw configuration or credentials.
5. If remote evidence leaves battery/range/hardware hypotheses, ask for one targeted physical test. Observe a bounded watch and recheck last-seen.
6. Explain the supported diagnosis and smallest repair. Follow workspace approval/backup rules before live changes; don't reinstall or re-pair speculatively.
7. Verify entry health, entity identity, fresh reports, derived availability and new error absence after a repair.

Specializations: [SonoffLAN](../ha-sonoff-debug/SKILL.md), [ZHA](../ha-zha-debug/SKILL.md), [module management](../ha-module-management/SKILL.md).
Report a short evidence table and the next step. Separate confirmed failures from possible causes.