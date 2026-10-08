import { readFile, mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, Scalar } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const write = args.includes('--write');
const requested = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--write') continue;
  if (args[i] === '--module' && args[i + 1]) requested.push(args[++i]);
  else throw new Error('Usage: build.mjs [--write] [--module ha-laundry] [--module ha-garage]');
}
const catalog = JSON.parse(await readFile(resolve(root, 'modules.json'), 'utf8'));
for (const id of requested) if (!catalog.modules.some(module => module.id === id)) throw new Error(`Unknown module: ${id}`);
const modules = catalog.modules.filter(module => requested.length ? requested.includes(module.id) : module.enabled);
const packages = {};
const dashboards = {};
const files = [];
for (const module of modules) {
  if (!/^ha-[a-z0-9-]+$/.test(module.id)) throw new Error('Invalid module id');
  const sourceFiles = [module.package, module.dashboard];
  for (const path of sourceFiles) {
    const full = resolve(root, path);
    if (!full.startsWith(root.endsWith(sep) ? root : `${root}${sep}`) || !path.startsWith(`${module.id}/`)) {
      throw new Error('Module source must stay within its module folder');
    }
    await access(full);
    files.push({ source: full, destination: `modules/${path}` });
  }
  const include = new Scalar(`modules/${module.package}`);
  include.tag = '!include';
  packages[module.id.replaceAll('-', '_')] = include;
  dashboards[module.id] = { mode: 'yaml', title: module.title, icon: module.icon,
    show_in_sidebar: true, filename: `modules/${module.dashboard}` };
}
const document = new Document({ homeassistant: { packages },
  lovelace: { mode: 'storage', resource_mode: 'storage', dashboards } });
document.commentBefore = ' MERGE FRAGMENT ONLY. Preserve existing homeassistant/lovelace keys.\n Never replace the live configuration with this file.';
console.log(JSON.stringify({ mode: write ? 'local-build' : 'plan', modules: modules.map(module => module.id),
  dependencies: modules.flatMap(module => module.dependencies),
  destinations: [...files.map(file => file.destination), 'configuration-managed.yaml'],
  live_changes: false }, null, 2));
if (write) {
  const output = resolve(root, 'dist');
  // Clean only our output directory to prevent disabled modules leaving stale files.
  const { rm } = await import('node:fs/promises');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of files) {
    const destination = resolve(output, file.destination);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(file.source, destination);
  }
  await writeFile(resolve(output, 'configuration-managed.yaml'), String(document));
  console.log('Local artifact ready. No upload, install, restart or configuration merge performed.');
}