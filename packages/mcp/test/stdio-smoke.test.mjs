import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const waitForHealth = async (port) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {}

    await delay(100);
  }

  throw new Error(`Timed out waiting for MCP health check on port ${port}`);
};

test("ui-grab-mcp serves context over stdio and HTTP", async () => {
  const port = 49300 + Math.floor(Math.random() * 1000);
  const binPath = fileURLToPath(new URL("../bin/ui-grab-mcp.cjs", import.meta.url));

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [binPath, "--stdio"],
    env: { ...process.env, PORT: String(port) },
  });

  const client = new Client({ name: "ui-grab-mcp-test", version: "0.0.0" });

  try {
    await client.connect(transport);
    await waitForHealth(port);

    const submitResponse = await fetch(`http://127.0.0.1:${port}/context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt: "Turn this button blue",
        content: ["<button>Join the village</button>"],
      }),
    });

    assert.equal(submitResponse.status, 200);

    const result = await client.callTool({
      name: "get_element_context",
      arguments: {},
    });

    assert.equal(result.content?.[0]?.type, "text");
    assert.match(result.content?.[0]?.text ?? "", /Prompt: Turn this button blue/);
    assert.match(
      result.content?.[0]?.text ?? "",
      /<button>Join the village<\/button>/,
    );
  } finally {
    await client.close().catch(() => {});
  }
});
