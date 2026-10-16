import JSZip from 'jszip';
import { ExportService } from '../src/modules/export/export.service';
import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

describe('Data export (ACC-002)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('builds a ZIP with the user data and photos, emails a 24 h link, and limits to one per 7 days', async () => {
    const u = await onboard(ctx, 'anna@example.com');
    await ctx.http.post('/v1/me/export').set(bearer(u.token)).expect(202);
    let status = await ctx.http.get('/v1/me/export').set(bearer(u.token)).expect(200);
    for (let i = 0; i < 20 && status.body.status !== 'ready'; i++) {
      await new Promise((res) => setTimeout(res, 200));
      status = await ctx.http.get('/v1/me/export').set(bearer(u.token)).expect(200);
    }
    expect(status.body.status).toBe('ready');
    expect(ctx.email.outbox.get('anna@example.com')?.subject).toMatch(/export is ready/);
    const url = new URL(status.body.url as string);
    const file = await ctx.http.get(url.pathname + url.search).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    const zip = await JSZip.loadAsync(file.body as Buffer);
    const json = JSON.parse(await zip.file('export.json')!.async('string'));
    expect(json.account.email).toBe('anna@example.com');
    expect(json.questionnaireAnswers.length).toBeGreaterThan(30);
    expect(json.soulProfile.archetype).toBeDefined();
    expect(Object.keys(zip.files).filter((f) => f.startsWith('photos/') && !f.endsWith('/'))).toHaveLength(2);
    const again = await ctx.http.post('/v1/me/export').set(bearer(u.token));
    expect(again.body.error.code).toBe('EXPORT_LIMIT');
  });

  it('expired exports are cleaned up', async () => {
    const u = await onboard(ctx, 'anna@example.com');
    const r = await ctx.http.post('/v1/me/export').set(bearer(u.token)).expect(202);
    for (let i = 0; i < 20; i++) {
      const j = await ctx.prisma.dataExportJob.findUniqueOrThrow({ where: { id: r.body.id } });
      if (j.status === 'ready') break;
      await new Promise((res) => setTimeout(res, 200));
    }
    await ctx.app.get(ExportService).cleanup(new Date(Date.now() + 2 * 86_400_000));
    const s = await ctx.http.get('/v1/me/export').set(bearer(u.token)).expect(200);
    expect(s.body.status).toBe('expired');
    expect(s.body.url).toBeNull();
  });
});
