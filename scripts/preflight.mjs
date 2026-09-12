import net from 'node:net';

/**
 * Refuses to run the gate when the infrastructure it needs is down.
 *
 * This exists because of a real failure: Docker had stopped, the integration
 * tests skipped themselves, and `npm run verify` printed
 * "5 passed | 3 skipped" — which reads as success at a glance. The tests that
 * vanished were the grounding and script-boundary ones, the two guarantees the
 * whole product rests on.
 *
 * A console warning was tried first and did not work: vitest suppresses console
 * output from a skipped file, so nobody ever saw it. A precondition that fails
 * the command is the only version of "loud" that survives.
 */

const SERVICES = [
  { name: 'Postgres', host: '127.0.0.1', port: 5432 },
  { name: 'Redis', host: '127.0.0.1', port: 6379 },
];

function reachable({ host, port }, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

const results = await Promise.all(
  SERVICES.map(async (service) => ({ ...service, up: await reachable(service) })),
);

const down = results.filter((r) => !r.up);

for (const { name, port, up } of results) {
  console.log(`  ${up ? 'ok  ' : 'DOWN'}  ${name} (:${port})`);
}

if (down.length > 0) {
  console.error(
    `\nCannot verify: ${down.map((d) => d.name).join(' and ')} ${down.length === 1 ? 'is' : 'are'} not running.\n` +
      `Integration tests would silently skip, and the grounding and script-boundary\n` +
      `guarantees would go unverified while the run still looked broadly fine.\n\n` +
      `Start them with:  docker compose up -d\n`,
  );
  process.exit(1);
}
