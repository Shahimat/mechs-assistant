import { promises as fs } from 'node:fs';
import path from 'node:path';

const USER_AGENT = 'mechs-assistant-parser/0.1';

/**
 * Читает HTML указанного URL с отключённым mod_pagespeed (`?PageSpeed=off`),
 * иначе `img[src]` возвращается как placeholder `/pagespeed_static/*.gif`
 * и раскрывается только в браузере.
 */
export async function fetchText(url: string): Promise<string> {
  const withNoOptim = url + (url.includes('?') ? '&' : '?') + 'PageSpeed=off';
  const res = await fetch(withNoOptim, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

export async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
