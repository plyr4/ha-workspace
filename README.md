# Home Assistant Workspace (ha-workspace)

Configuration modules and tools for managing my Home Assistant setup.

## Setup

Clone with `git clone --recurse-submodules git@github.com:plyr4/ha-workspace.git`.
For an existing clone, use `git submodule update --init --recursive`.

Use `nvm install`, `nvm use`, then `npm ci`. [.nvmrc](.nvmrc) specifies Node 22.
HA commands use `HA_URL` and `HA_TOKEN` from the environment.

## Modules

| Module | What it contains |
| --- | --- |
| [Laundry](ha-laundry/README.md) | Activity sensors, last-use helper, automation and power dashboard |
| [Garage](ha-garage/README.md) | Tilt-sensor displays and a monitoring dashboard; existing notifications still need importing |

These are Git submodules of [plyr4/ha-laundry](https://github.com/plyr4/ha-laundry) and
[plyr4/ha-garage](https://github.com/plyr4/ha-garage), configured in [.gitmodules](.gitmodules).
Commit and push module changes in their own repositories, then commit the updated submodule pointers in this workspace.
`git submodule update --init --recursive` checks out the workspace's recorded commits, not the latest remote branches.

[modules.json](modules.json) selects which modules to build. These packages have not been deployed yet.
See [configuration layout](docs/architecture.md) for how they fit into HA.

## Commands

| Command | What it does |
| --- | --- |
| `npm run check` | Check YAML/JSON, links and documented command names |
| `npm test` | Test the API client's environment configuration and output filtering |
| `npm run check:templates` | Render garage/laundry test cases through HA without changing states |
| `npm run plan` | Show which module files would be built |
| `npm run build` | Write module files and a configuration merge fragment to `dist/` |
| `npm run ha:garage` | Inspect garage sensors and ZHA health |
| `npm run ha:sonoff` | Inspect SonoffLAN and plug connectivity |

Build commands write locally, not to HA. [Operations](docs/operations.md) covers other diagnostics and installation.

## Copilot skills

Type `/` in chat to select one of these skills:

| Skill | Use it for |
| --- | --- |
| `/ha-device-debug` | Diagnose any device or entity |
| `/ha-sonoff-debug` | SonoffLAN and eWeLink Wi-Fi plugs |
| `/ha-zha-debug` | Zigbee devices and garage tilt sensors |
| `/ha-module-management` | Import a capability, compare live configuration, or plan a module migration |

Ask for the module or device by name alongside the skill. For example, use `/ha-module-management` to import the existing garage dashboard and notifications.