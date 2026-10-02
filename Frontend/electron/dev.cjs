const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const smoke = process.argv.includes('--smoke');
const server = spawn(process.execPath, [path.join(root, 'node_modules/@angular/cli/bin/ng.js'), 'serve', '--configuration', 'desktop-development', '--host', 'localhost', '--port', '4200'], { cwd: root, stdio: 'inherit', windowsHide: true });
let desktop;
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  if (desktop) desktop.kill();
  server.kill();
  process.exitCode = code;
}
server.on('error', error => { console.error(error); stop(1); });
server.on('exit', code => { if (!stopping) stop(code || 1); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
(async () => {
  const deadline = Date.now() + 120000;
  while (!stopping && Date.now() < deadline) {
    try { if ((await fetch('http://localhost:4200', { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (stopping) return;
  if (Date.now() >= deadline) throw new Error('Angular startup timed out');
  const environment = { ...process.env };
  delete environment.ELECTRON_RUN_AS_NODE;
  desktop = spawn(require('electron'), [path.join(__dirname, 'main.cjs'), '--dev', ...(smoke ? ['--smoke'] : [])], { cwd: root, env: environment, stdio: 'inherit', windowsHide: smoke });
  desktop.on('error', error => { console.error(error); stop(1); });
  desktop.on('exit', code => stop(code || 0));
})().catch(error => { console.error(error); stop(1); });
