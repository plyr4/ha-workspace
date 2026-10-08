---
name: ha-module-management
description: "Use when importing Home Assistant UI configuration into modules, creating HA packages/dashboards, inventorying dependencies, comparing configuration drift, or planning module installation and recovery."
---

# Module management

See [layout](../../../docs/architecture.md), [operations](../../../docs/operations.md) and [catalog](../../../modules.json).

## Import a capability

1. Identify its raw inputs, helpers/templates, automations/scripts, dashboard/resources and shared integrations. Compare local source with current HA configuration.
2. Read live source privately; export only reviewed configuration. Record dependencies and missing pieces without inventing versions or copying credentials.
3. Keep supported YAML in the module package and its dashboard separately. Integration registrations/resources remain shared site configuration.
4. Preserve entity/automation IDs. New unique IDs need a registry collision check. Keep unavailable handling explicit and physical event timestamps separate from HA startup.
5. Add declared files to the catalog; run local checks, tests and plan/build. The builder copies only the package/dashboard, not arbitrary assets or nested includes.

## Install or compare drift

- For installation, prepare a narrow diff that removes equivalent old definitions when adding the package. Preserve unrelated UI configuration.
- Request live-change approval with backup/rollback details. Run HA configuration check before restart/reload and verify IDs, reports, dashboard resources and automation uniqueness afterward.
- For drift, compare normalized reviewed source and dependency versions. Report differences without overwriting UI edits.

## Recovery planning

Inventory integrations, add-ons and resources, and verify supported HA/ZHA backup coverage.
YAML rebuilds module logic, not UI registrations, credentials or pairing. List clean-install config flows and physical steps honestly.
Plan an isolated restore test before teardown; don't wipe, replay `.storage` or start competing coordinators as part of a planning task.