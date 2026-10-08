# Home Assistant workspace

## Conventions
- Modules live in `ha-*` folders: package, dashboard, inventory and README. [modules.json](../modules.json) selects local build output.
- Use `HA_URL` and `HA_TOKEN` from the environment. Don't load credential files or print secrets. Summarize diagnostics rather than dumping raw stores/logs.
- Keep documentation short and practical. Document only commands/files that exist. Use plain prose, not status banners or repeated safety disclaimers.
- Use [.nvmrc](../.nvmrc) and [package.json](../package.json) for Node requirements. Don't change global npm settings or disable TLS verification.

## HA changes
- Start with integration/config-entry health, then raw devices, then templates/dashboard/automations. Distinguish facts from hypotheses.
- Preserve registrations and entity/history identity. Don't hand-edit `.storage`, blindly reinstall, reset/re-pair or flash devices.
- Unknown/unavailable inputs must not appear Closed, idle or zero. HA startup timestamps aren't physical event timestamps.
- Local build isn't deployment. Before live writes/restarts, explain the diff, backup and rollback, and get approval. Remove equivalent old definitions in the same migration; check for duplicate entities/automations afterward.
- Ask before operating doors, interrupting appliances, calibrating devices or sending notifications. Physical tests are user-assisted.
- Verify fresh device reports and new errors after a repair. Packages don't recreate UI registrations or Zigbee pairing; those need supported backup/restore.

## Tools
- `npm run check`, `npm test`, `npm run plan`, `npm run build`: local validation and composition.
- `npm run check:templates`: read-only HA template rendering; not full HA schema validation.
- [API diagnostics](../scripts/ha-inspect.mjs) and [operations](../docs/operations.md) cover live inspection and installation.
- Skills: [device debugging](skills/ha-device-debug/SKILL.md), [SonoffLAN](skills/ha-sonoff-debug/SKILL.md), [ZHA](skills/ha-zha-debug/SKILL.md), [module management](skills/ha-module-management/SKILL.md).