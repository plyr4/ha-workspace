import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { connection } from './lib/ha-client.mjs';

// Rendering templates is read-only: no services, state writes or device commands.
const { url, token } = await connection();
const garage = parse(await readFile(new URL('../ha-garage/package.yaml', import.meta.url), 'utf8'));
const laundry = parse(await readFile(new URL('../ha-laundry/package.yaml', import.meta.url), 'utf8'));
let checks = 0;
async function render(template) {
  const response = await fetch(`${url}/api/template`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ template }),
  });
  if (!response.ok) throw new Error(`Template render returned HTTP ${response.status}`);
  return (await response.text()).trim();
}
async function check(template, expected, label) {
  const result = await render(template);
  if (typeof expected === 'function' ? !expected(result) : result !== expected) {
    throw new Error(`Unexpected template result for ${label}`);
  }
  checks++;
}
try {
  for (const sensor of garage.template[0].sensor) {
    for (const state of ['on', 'off', 'unknown', 'unavailable']) {
      const fixture = template => template
        .replace(/states\('binary_sensor\.[^']+'\)/g, `'${state}'`)
        .replace(/states\.binary_sensor\.[a-z0-9_]+/g, `namespace(state='${state}', last_changed=now())`);
      const available = state === 'on' || state === 'off';
      await check(fixture(sensor.availability), available ? 'True' : 'False', `${sensor.name}/${state}/availability`);
      const expected = !available ? 'Unknown' : state === 'on' ? 'Open' : 'Closed';
      await check(fixture(sensor.state), sensor.name.endsWith('last_change') && available
        ? value => value.includes(`: ${expected};`) && value.includes('HA state observed at')
        : expected, `${sensor.name}/${state}/state`);
    }
  }
  for (const sensor of laundry.template[0].binary_sensor) {
    for (const [power, available, active, idle] of [
      ['unavailable', false, false, true], ['unknown', false, false, true],
      ['0', true, false, true], ['10', true, false, false], ['30', true, false, false], ['31', true, true, false],
    ]) {
      const fixture = template => template.replace(/states\('sensor\.sonoff_[^']+'\)/g, `'${power}'`);
      await check(fixture(sensor.availability), available ? 'True' : 'False', `${sensor.name}/${power}/availability`);
      await check(fixture(sensor.state), (sensor.name === 'Laundry Available' ? idle : active) ? 'True' : 'False',
        `${sensor.name}/${power}/state`);
    }
  }
  console.log(`Passed ${checks} HA-rendered Jinja fixture checks; no live configuration/state changed.`);
  console.log('This checks template behavior, NOT package/schema validity or deployed entity identity.');
} catch {
  console.error('HA template checks failed; no raw response, template result or credentials printed.');
  process.exitCode = 1;
}