# Configuration layout

Each `ha-*` folder owns one capability: a [Home Assistant package](https://www.home-assistant.io/docs/configuration/packages/),
a dashboard, and setup notes. Shared integrations, add-ons and frontend resources belong to the HA installation, not to individual modules.

## Build output

[modules.json](../modules.json) lists each module's package, dashboard and dependencies.
`enabled` selects it for the build; it does not enable anything on the host.

The [builder](../scripts/build.mjs) writes:
- Module packages and dashboards under `dist/modules/`.
- A `dist/configuration-managed.yaml` fragment with explicit package includes and dashboard registrations.

The fragment assumes UI-managed default dashboards/resources. Merge its entries with the existing configuration;
do not replace existing `homeassistant` or `lovelace` mappings. The builder copies only the declared package and dashboard files.

## Moving existing configuration

Import one module at a time. Compare its source with live definitions, preserve entity and automation IDs,
and remove equivalent old definitions when adding the package. New template unique IDs can cause name collisions,
so verify the final entity IDs rather than assuming they stayed the same.

Laundry's original snippets remain for reference; use the package for future installation.
Garage's package fixes unavailable-state handling. Its dashboard is a new monitoring view, not a copy of the existing UI dashboard.
The garage notification scripts and automation still need importing.

See [operations](operations.md) for installation and validation.

## Recreating the installation

The repo contains YAML logic and dashboards, not the entire running installation.
[HA backups](https://www.home-assistant.io/integrations/backup/) preserve UI integration registrations, credentials,
device/entity registries and other runtime configuration. Retain a ZHA network backup for coordinator recovery as well.
Keep backups and recovery keys outside the repo.

Restoring a supported backup is the shortest path to preserving the existing setup.
A clean installation still requires onboarding, integrations/HACS/add-ons, frontend resources and a restored or newly paired Zigbee network.
The full dependency inventory and a restore test are still outstanding.