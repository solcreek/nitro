import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

/** Find an ephemeral free TCP port on localhost. */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

/** Poll until the server answers on `url`, or throw after `timeoutMs`. */
async function waitListening(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      // Any HTTP response (including 404) is proof the listener is up.
      await res.body?.cancel();
      return;
    } catch (err) {
      lastError = err;
      await delay(50);
    }
  }
  throw new Error(
    `Server at ${url} did not become ready within ${timeoutMs}ms: ${String(lastError)}`,
  );
}

export interface SpawnedServer {
  url: string;
  close: () => Promise<void>;
}

/**
 * Spawn a Nitro `node-server` build output as a child process and wait
 * for it to be listening. The entry expects `NITRO_PORT` / `PORT` in its
 * env; we pick a free ephemeral port and inject it.
 *
 * `extraEnv` is merged on top of process.env so callers can inject the
 * fixture's `ctx.env` (NITRO_HELLO=world, etc.) — these are the same
 * vars the harness exports for in-process presets via `process.env`.
 */
export async function spawnNodeServer(
  entryPath: string,
  extraEnv: Record<string, string> = {},
  timeoutMs = 15_000,
): Promise<SpawnedServer> {
  const port = await freePort();
  // --enable-source-maps so runtime error stacks resolve back to source
  // paths (needed for the "sourcemap works" conformance assertion and
  // for any debugger output).
  const child = spawn(process.execPath, ["--enable-source-maps", entryPath], {
    env: {
      ...process.env,
      ...extraEnv,
      NITRO_PORT: String(port),
      PORT: String(port),
      HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Surface crashes loudly — silent child exits are the worst failure mode
  // for the harness to debug.
  const crashedEarly = new Promise<never>((_, reject) => {
    child.once("exit", (code, signal) => {
      reject(
        new Error(
          `node-server child exited before ready (code=${code} signal=${signal})`,
        ),
      );
    });
  });

  const url = `http://127.0.0.1:${port}`;
  try {
    await Promise.race([waitListening(url, timeoutMs), crashedEarly]);
  } catch (err) {
    child.kill("SIGKILL");
    throw err;
  }

  return {
    url,
    close: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", () => resolve());
        child.kill("SIGTERM");
        // srvx keeps connections alive and can resist SIGTERM. Don't
        // wait long — escalate to SIGKILL fast so test teardown stays
        // quick. Not .unref()'d so the timer keeps the loop alive
        // until it fires (otherwise teardown can race and exit early
        // before SIGKILL lands).
        setTimeout(() => {
          if (child.exitCode === null) child.kill("SIGKILL");
        }, 500);
      }),
  };
}
