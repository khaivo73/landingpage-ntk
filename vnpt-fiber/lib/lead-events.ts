import { open, chmod, rename, unlink } from 'node:fs/promises';
import path from 'node:path';

async function syncDirectory(directory: string) {
  const handle = await open(directory, 'r');
  try { await handle.sync(); } finally { await handle.close(); }
}

// A durable local marker contains only the request UUID, never customer data.
// It is created before persistence and activated after a definite or uncertain result.
export async function prepareLeadEvent(id: string, root = process.env.LEAD_EVENTS_DIR) {
  if (!root) return null; // Compatibility until event mode is explicitly enabled.
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('INVALID_EVENT_ID');
  const file = path.join(root, 'pending', id + '.json');
  try {
    const handle = await open(file, 'wx', 0o660);
    try { await handle.writeFile('{}'); await handle.sync(); } finally { await handle.close(); }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  await chmod(file, 0o660); // Override the web service's restrictive umask for its dedicated group.
  await syncDirectory(path.dirname(file));
  return { pending: file, ready: path.join(root, 'ready', id + '.json') };
}

export async function activateLeadEvent(event: Awaited<ReturnType<typeof prepareLeadEvent>>) {
  if (!event) return;
  try {
    await rename(event.pending, event.ready);
    await syncDirectory(path.dirname(event.pending));
    await syncDirectory(path.dirname(event.ready));
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    // A concurrent request with the same UUID may already have activated it.
  }
}

export async function cancelLeadEvent(event: Awaited<ReturnType<typeof prepareLeadEvent>>) {
  if (event) await unlink(event.pending).catch(() => undefined);
}
