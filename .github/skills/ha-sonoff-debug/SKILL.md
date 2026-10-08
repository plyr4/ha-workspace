---
name: ha-sonoff-debug
description: "Use when debugging SonoffLAN, eWeLink Wi-Fi plugs, unavailable Sonoff entities, missing manifests, HACS package layout or cloud versus LAN connectivity. Not for Zigbee devices owned by ZHA."
---

# SonoffLAN debugging

Follow [device debugging](../ha-device-debug/SKILL.md). Run `npm run ha:sonoff` and inspect registry mappings if identity is uncertain.

## Loading

1. Inspect `/config/custom_components/sonoff`: its root needs a valid `manifest.json`, `__init__.py`, `config_flow.py` and referenced modules. Check for an extra nested folder if files appear missing.
2. Verify manifest domain/version/dependencies and compare selected HACS metadata for `AlexxIT/SonoffLAN`. Directory existence isn't proof of a loadable package.
3. Query `manifest/get` (`integration: sonoff`) and `config_entries/get` (`domain: sonoff`). Check current-startup logs for manifest, import and setup errors.
4. Capture file/manifest evidence and a backup before proposing a repair. Prefer supported HACS installation; a proven layout problem may need only a reversible move, not a reinstall.

## Connectivity

1. Once the entry loads, compare cloud `online`, LAN `local`, discovered `host` and fresh telemetry. Cached switch/power values aren't proof of availability.
2. Compare a working plug. Check eWeLink status and the router's connected-client list by MAC.
3. Browse `_ewelink._tcp.local.` briefly, suppressing TXT payloads. If the host is known, test TCP reachability (usually port 8081) without switching/configuring the plug. An arbitrary HTTP GET can fail while its service works.
4. For cloud + LAN offline, ask for Wi-Fi/power evidence. Verify exact-model button instructions; don't interrupt an active appliance or enter pairing mode automatically.

Success means loaded entry/manifest, enabled entities available, fresh measurements and no new related errors.
Disabled-by-integration entities and the generic custom-integration warning aren't failures.