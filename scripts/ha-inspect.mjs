import { get, select, stateSummary, websocket } from './lib/ha-client.mjs';

const [command = 'states', filter = '', duration = '60'] = process.argv.slice(2);
const print = value => console.log(JSON.stringify(value, null, 2));
const matches = (state, text) => `${state.entity_id} ${state.attributes?.friendly_name || ''}`.toLowerCase().includes(text.toLowerCase());

try {
  if (command === 'states') {
    print((await get('/api/states')).filter(state => matches(state, filter)).map(stateSummary));
  } else if (command === 'entries') {
    print((await websocket({ type: 'config_entries/get', ...(filter ? { domain: filter } : {}) }))
      .filter(entry => !filter || entry.domain === filter)
      .map(entry => select(entry, ['entry_id', 'domain', 'state', 'disabled_by'])));
  } else if (command === 'registry') {
    const entities = await websocket({ type: 'config/entity_registry/list' });
    const devices = await websocket({ type: 'config/device_registry/list' });
    const selected = entities.filter(entity => [entity.entity_id, entity.name, entity.original_name]
      .some(value => value?.toLowerCase().includes(filter.toLowerCase())));
    const ids = new Set(selected.map(entity => entity.device_id));
    print({ entities: selected.map(entity => select(entity, ['entity_id', 'platform', 'unique_id',
      'device_id', 'config_entry_id', 'disabled_by', 'original_name'])),
    devices: devices.filter(device => ids.has(device.id)).map(device => select(device,
      ['id', 'name', 'name_by_user', 'manufacturer', 'model', 'identifiers', 'connections', 'disabled_by'])) });
  } else if (command === 'garage' || command === 'zha') {
    const entries = await websocket({ type: 'config_entries/get', domain: 'zha' });
    const devices = await websocket({ type: 'zha/devices' });
    print({ integration: entries.filter(entry => entry.domain === 'zha').map(entry => select(entry,
      ['entry_id', 'domain', 'state', 'disabled_by'])),
    devices: devices.map(device => select(device, ['ieee', 'name', 'user_given_name', 'manufacturer', 'model',
      'device_type', 'available', 'last_seen', 'lqi', 'rssi', 'power_source', 'quirk_applied', 'quirk_class'])),
    entities: (await get('/api/states')).filter(state => matches(state, 'garage')).map(stateSummary) });
  } else if (command === 'sonoff') {
    const entries = (await websocket({ type: 'config_entries/get', domain: 'sonoff' })).filter(entry => entry.domain === 'sonoff');
    const devices = [];
    for (const entry of entries) {
      const result = await get(`/api/diagnostics/config_entry/${encodeURIComponent(entry.entry_id)}`);
      for (const [deviceid, device] of Object.entries(result.data?.devices || {})) {
        devices.push({ deviceid, ...select(device, ['model', 'online', 'local', 'localtype', 'host']),
          params: select(device.params || {}, ['switch', 'power', 'current', 'voltage', 'rssi']) });
      }
    }
    const manifest = await websocket({ type: 'manifest/get', integration: 'sonoff' });
    print({ manifest: select(manifest, ['domain', 'version', 'requirements']),
      entries: entries.map(entry => select(entry, ['entry_id', 'domain', 'state', 'disabled_by'])), devices,
      entities: (await get('/api/states')).filter(state => matches(state, 'sonoff')).map(stateSummary) });
  } else if (command === 'watch') {
    const seconds = Number(duration);
    if (!filter || !Number.isInteger(seconds) || seconds < 1 || seconds > 300) {
      throw new Error('watch requires a filter and duration of 1–300 seconds');
    }
    console.log(`Watching matching state changes for ${seconds} seconds; no device commands will be sent.`);
    print(await websocket({ type: 'subscribe_events', event_type: 'state_changed' }, {
      seconds, onEvent: event => {
        const state = event.data?.new_state;
        if (state && matches(state, filter)) print(stateSummary(state));
      },
    }));
  } else throw new Error('Commands: states [filter], entries [domain], registry [filter], garage, zha, sonoff, watch <filter> [seconds]');
} catch (error) {
  // Do not print raw API errors, response bodies, credentials or stack traces.
  const safe = /^(HA |watch |Commands:)/.test(error.message) ? error.message : 'Inspection failed; check connectivity and local credential configuration';
  console.error(safe);
  process.exitCode = 1;
}