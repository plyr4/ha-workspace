export function connection(env = process.env) {
  const { HA_URL: address, HA_TOKEN: token } = env;
  if (!address) throw new Error('HA_URL is missing from the environment');
  if (!token) throw new Error('HA_TOKEN is missing from the environment');
  let url;
  try { url = new URL(address); }
  catch { throw new Error('HA_URL must be an HTTP(S) origin'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('HA_URL must be an HTTP(S) origin without credentials, path or query');
  }
  return { url: url.origin, token };
}

export async function get(path) {
  const { url, token } = await connection();
  const response = await fetch(`${url}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`HA read request returned HTTP ${response.status}`);
  return response.json();
}

export async function websocket(request, { seconds, onEvent } = {}) {
  const allowed = new Set(['config_entries/get', 'config/entity_registry/list',
    'config/device_registry/list', 'zha/devices', 'manifest/get', 'subscribe_events']);
  if (!allowed.has(request.type)) throw new Error('Only allowlisted read-only WebSocket requests are supported');
  const { url, token } = await connection();
  return new Promise((resolvePromise, reject) => {
    const ws = new WebSocket(`${url.replace(/^http/, 'ws')}/api/websocket`);
    let done = false;
    const finish = (error, result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      ws.close();
      error ? reject(error) : resolvePromise(result);
    };
    let timer = setTimeout(() => finish(new Error('HA WebSocket request timed out')), 15000);
    ws.onmessage = ({ data }) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: token }));
        else if (message.type === 'auth_ok') ws.send(JSON.stringify({ id: 1, ...request }));
        else if (message.type === 'auth_invalid') finish(new Error('HA authentication failed'));
        else if (message.type === 'result') {
          if (!message.success) finish(new Error(`HA request failed (${message.error?.code || 'unknown'})`));
          else if (onEvent) {
            clearTimeout(timer);
            timer = setTimeout(() => finish(null, { observed_seconds: seconds }), seconds * 1000);
          } else finish(null, message.result);
        } else if (message.type === 'event') onEvent?.(message.event);
      } catch { finish(new Error('HA response could not be processed')); }
    };
    ws.onerror = () => finish(new Error('HA WebSocket connection failed'));
    ws.onclose = () => { if (!done) finish(new Error('HA WebSocket closed before completion')); };
  });
}

export function select(object, fields) {
  return Object.fromEntries(fields.filter(key => object[key] !== undefined).map(key => [key, object[key]]));
}

export function stateSummary(state) {
  return { ...select(state, ['entity_id', 'state', 'last_changed', 'last_updated']),
    ...select(state.attributes || {}, ['friendly_name', 'device_class', 'unit_of_measurement']) };
}