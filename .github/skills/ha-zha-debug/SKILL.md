---
name: ha-zha-debug
description: "Use when debugging ZHA Zigbee devices, garage tilt sensors, Third Reality 3RDTS01056Z, stale last-seen, batteries, coordinator/mesh health or incorrect open/closed displays."
---

# ZHA debugging

Follow [device debugging](../ha-device-debug/SKILL.md). Run `npm run ha:garage` or inspect ZHA through [API diagnostics](../../../scripts/ha-inspect.mjs).
[Garage inventory](../../../ha-garage/inventory.json) records known hardware and mappings.

1. Identify raw tilt/battery entities, IEEE, model and owning config entry. Zigbee devices aren't Wi-Fi clients; router IP lists don't diagnose them.
2. Check ZHA entry load, coordinator, powered routers and end-device availability/last-seen via `zha/devices`. Compare working devices.
3. Confirm radio/serial errors and stable `/dev/serial/by-id` settings if coordinator health is suspect. Never export network keys into chat.
4. Check quirk support and raw state reports before calibration or firmware changes. Missing map links/RSSI alone don't prove a failure.
5. Check derived templates independently: unavailable must not become Closed; HA startup timestamps aren't door movement times.

## Physical test

- Ask about battery age/contacts and whether the extender stays powered. Verify the exact model manual before suggesting button sequences.
- When the user is ready, watch for up to 90 seconds while they safely test one sensor. Recheck last-seen even if no state-change event appears.
- Test fresh correct batteries or a brief battery removal/reinsertion without resetting. If it works near the coordinator but not installed, investigate mesh routing, metal shielding and USB interference.
- Reconfigure/reporting changes, calibration, joining, channel/radio migration and firmware writes need approval. None is the first step for an offline battery sensor.

Verify both doors independently: fresh reports, correct physical open/closed polarity, battery/availability and no new radio errors.
Reference: [ZHA documentation](https://www.home-assistant.io/integrations/zha/).