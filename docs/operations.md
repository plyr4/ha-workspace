# Operations

## Connection

The API tools require `HA_URL` and `HA_TOKEN` in the environment. They don't load credential files.
SSH uses the existing key for `root@192.168.50.182`, port 22.

## Diagnostics

Use [ha-inspect.mjs](../scripts/ha-inspect.mjs):

| Arguments | Output |
| --- | --- |
| `states <filter>` | Matching entity states and timestamps |
| `entries <domain>` | Integration config-entry state |
| `registry <filter>` | Entity/device identity mappings |
| `garage` or `zha` | ZHA health, device last-seen and garage states |
| `sonoff` | Manifest, config entries and cloud/LAN device status |
| `watch <filter> <seconds>` | State changes during a 1–300 second window |

For example, `node scripts/ha-inspect.mjs watch garage 90` watches a manual sensor test.
These commands don't operate devices. A watch with no events isn't proof of no communication;
unchanged reports may produce no state change. Check Zigbee `last_seen` too.

The SSH shell is an add-on container, not the HA Core process. Its network view can differ.
`/config` is a symlink; use `find -L` when listing it. BusyBox `find` supports `-print`, not `-printf`.
When checking logs, filter by the test/startup timestamp so old errors aren't counted as new failures.

## Install a module

1. Run `npm run check`, `npm test` and `npm run build`. Optionally run `npm run check:templates` against HA.
2. Review the live configuration and back it up. Install the module's integration/frontend dependencies if needed.
3. Copy its generated files into `/config/modules/`. Merge its package/dashboard entries into the main configuration and remove equivalent old definitions.
4. Run `ha core check` on that configuration before restarting or reloading.
5. Verify entity IDs, raw/derived states, dashboard resources and automations. If validation fails, restore the previous files.

The generated fragment is not a replacement main configuration. Syntax checks and template rendering don't validate HA schemas.
There is no deploy script; agree on the exact live changes before applying them.

## npm troubleshooting on this Mac

If `npm ci` fails because of the corporate registry or missing CA file, the following worked here:
`npm ci --ignore-scripts --registry=https://registry.npmjs.org --cafile=/opt/homebrew/etc/openssl@3/cert.pem`.
Use it only if that trust bundle exists. Keep TLS verification enabled.k,l