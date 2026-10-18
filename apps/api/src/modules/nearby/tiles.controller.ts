import { Controller, Get, Ip, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/auth';
import { AppError, notFound } from '../../common/errors';
import { RateLimiter } from '../../common/rate-limit';

const UPSTREAM = 'https://tile.openstreetmap.org';
const USER_AGENT = 'NearSoul-alpha/0.1 (+https://github.com/Collapsar-Dev/NearSoul)';
const MAX_ZOOM = 17;
const CACHE_MAX = 1500; // ≈ 30 MB of PNG tiles

/**
 * CR-29: OpenStreetMap tiles through our server, so the map works without a key, follows the OSM tile policy
 * (one identified client, cached) and people's IPs are never sent to the tile server. Tiles carry no user data.
 */
@Controller('v1/tiles')
export class TilesController {
  private readonly cache = new Map<string, Buffer>();
  private readonly inflight = new Map<string, Promise<Buffer | null>>();

  constructor(private readonly limiter: RateLimiter) {}

  @Public()
  @Get(':z/:x/:y.png')
  async tile(@Param('z') zs: string, @Param('x') xs: string, @Param('y') ys: string, @Ip() ip: string, @Res() res: Response) {
    const [z, x, y] = [zs, xs, ys].map((s) => (/^\d{1,6}$/.test(s) ? Number(s) : -1)) as [number, number, number];
    if (z < 0 || z > MAX_ZOOM || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) throw notFound();
    const key = `${z}/${x}/${y}`;
    let body = this.cache.get(key) ?? null;
    if (body) {
      this.cache.delete(key); // LRU: move to the end
      this.cache.set(key, body);
    } else {
      this.limiter.check(`tiles:${ip}`, 600, 60_000);
      body = await this.fetch(key);
      if (!body) throw new AppError(502, 'TILE_UNAVAILABLE', 'The map is unavailable right now.');
    }
    res.setHeader('content-type', 'image/png');
    res.setHeader('cache-control', 'public, max-age=604800');
    res.send(body);
  }

  private fetch(key: string): Promise<Buffer | null> {
    const running = this.inflight.get(key);
    if (running) return running;
    const p = (async () => {
      try {
        const r = await fetch(`${UPSTREAM}/${key}.png`, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) });
        if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) return null;
        const buf = Buffer.from(await r.arrayBuffer());
        this.cache.set(key, buf);
        if (this.cache.size > CACHE_MAX) this.cache.delete(this.cache.keys().next().value!);
        return buf;
      } catch {
        return null;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }
}
