import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

// From frontend/, build an image with the required API URL, then run:
// docker build --build-arg VITE_API_URL=http://backend:8000 -t my-app .
// SCHOLARK_TEST_IMAGE=my-app vp test run integration/container.test.ts
// The regular unit-test job does not require Docker or a prebuilt image.
const image = process.env.SCHOLARK_TEST_IMAGE;

function docker(...args: string[]): string {
  return execFileSync("docker", args, { encoding: "utf8", timeout: 15_000 }).trim();
}

describe.skipIf(!image)("frontend production container", () => {
  let container = "";
  let baseUrl = "";

  beforeAll(async () => {
    container = docker(
      "run",
      "--detach",
      "--publish",
      "127.0.0.1::3000",
      "--env",
      "SCHOLARK_SESSION_SECRET=container-test-secret",
      image!,
    );
    const port = docker("port", container, "3000/tcp").match(/:(\d+)$/)?.[1];
    if (!port) throw new Error("Docker did not publish the frontend port");
    baseUrl = `http://127.0.0.1:${port}`;

    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      try {
        await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(1_000) });
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    throw new Error(`Frontend did not start. Container logs:\n${docker("logs", container)}`);
  }, 30_000);

  afterAll(() => {
    if (container) docker("rm", "--force", container);
  });

  test("runs the configured Node version in production as a non-root user", () => {
    const runtime = JSON.parse(
      docker(
        "exec",
        container,
        "node",
        "-e",
        'console.log(JSON.stringify({ version: process.versions.node, env: process.env.NODE_ENV, uid: process.getuid() }))',
      ),
    );
    expect(runtime.version).toBe(readFileSync(".node-version", "utf8").trim());
    expect(runtime.env).toBe("production");
    expect(runtime.uid).toBeGreaterThan(0);
  });

  test("serves the server-rendered page and its built JavaScript", async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("Welcome to Scholark!");

    const scriptPath = html.match(/(?:src|href)="([^"]*\/assets\/[^"]+\.js)"/)?.[1];
    expect(scriptPath).toBeDefined();
    const script = await fetch(new URL(scriptPath!, baseUrl));
    expect(script.status).toBe(200);
    expect(script.headers.get("content-type")).toMatch(/javascript/);
    expect((await script.text()).length).toBeGreaterThan(0);
  });

  test("serves the login route with a session cookie", async () => {
    const response = await fetch(`${baseUrl}/login`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Login");
    expect(response.headers.get("set-cookie")).toContain("__session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  test("returns 404 for a missing asset", async () => {
    const response = await fetch(`${baseUrl}/assets/does-not-exist.js`);
    expect(response.status).toBe(404);
  });
});
