import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const ignored = new Set(['node_modules', '.git', 'dist', 'private', 'backups']);
const tags = ['!include', '!include_dir_named', '!include_dir_merge_named', '!include_dir_merge_list', '!secret']
  .map(tag => ({ tag, resolve: value => value }));
let failures = 0;
let checked = 0;
const commands = new Set();
const references = [];
const fail = (path, message) => { console.error(`${relative(root, path)}: ${message}`); failures++; };
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || /^(\.zsensitive|secrets\.yaml|ClientList)/.test(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!entry.isFile() || !/\.(yaml|yml|json|md|mjs)$/.test(entry.name)) continue;
    const text = await readFile(path, 'utf8');
    checked++;
    // Report only file and category; never print a matched secret.
    if (/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}|https:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/.test(text)) {
      fail(path, 'Possible credential detected; do not commit');
    }
    if (/\.ya?ml$/.test(entry.name)) {
      const doc = parseDocument(text, { customTags: tags, prettyErrors: false });
      if (doc.errors.length) fail(path, 'Invalid YAML or duplicate keys (source withheld)');
    } else if (entry.name.endsWith('.json')) {
      try { JSON.parse(text); } catch { fail(path, 'Invalid JSON'); }
    } else if (entry.name === 'SKILL.md' || entry.name.endsWith('.prompt.md')) {
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      if (!match) { fail(path, 'Missing YAML frontmatter'); continue; }
      const doc = parseDocument(match[1], { prettyErrors: false });
      if (doc.errors.length) { fail(path, 'Invalid frontmatter'); continue; }
      const metadata = doc.toJS();
      if (!metadata.description) fail(path, 'Missing description');
      if (entry.name === 'SKILL.md' && metadata.name !== directory.split('/').at(-1)) fail(path, 'Skill name/folder mismatch');
      if (metadata['user-invocable'] !== false) {
        commands.add(metadata.name || entry.name.replace(/\.prompt\.md$/, ''));
      }
    }
    if (entry.name.endsWith('.md')) {
      for (const match of text.matchAll(/`\/(ha-[a-z0-9-]+)(?:\s[^`]*)?`/g)) {
        references.push({ path, kind: 'command', name: match[1] });
      }
      for (const match of text.matchAll(/\bnpm run ([a-zA-Z0-9:._-]+)/g)) {
        references.push({ path, kind: 'script', name: match[1] });
      }
      for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0];
        if (!target || /^(?:[a-z]+:|\/)/i.test(target)) continue;
        try { await readFile(resolve(directory, decodeURIComponent(target))); }
        catch { fail(path, `Broken local documentation link: ${target}`); }
      }
    }
  }
}
await walk(root);
const { scripts, engines } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
for (const reference of references) {
  const exists = reference.kind === 'command' ? commands.has(reference.name) : Object.hasOwn(scripts, reference.name);
  if (!exists) fail(reference.path, `Unknown ${reference.kind}: ${reference.name}`);
}
const nodeVersion = (await readFile(resolve(root, '.nvmrc'), 'utf8')).trim();
if (engines.node !== `>=${nodeVersion}`) fail(resolve(root, '.nvmrc'), 'Node version differs from package engines');
const catalog = JSON.parse(await readFile(resolve(root, 'modules.json'), 'utf8'));
const ids = catalog.modules.map(module => module.id);
if (new Set(ids).size !== ids.length) fail(resolve(root, 'modules.json'), 'Duplicate module ids');
for (const module of catalog.modules) {
  for (const key of ['package', 'dashboard']) {
    try { await readFile(resolve(root, module[key])); }
    catch { fail(resolve(root, 'modules.json'), `Missing module ${key}: ${module.id}`); }
  }
}
console.log(`Checked ${checked} source files; ${failures} failures. This is NOT Home Assistant schema validation.`);
process.exitCode = failures ? 1 : 0;