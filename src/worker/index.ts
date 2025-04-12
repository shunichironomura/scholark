import { Hono } from "hono";

// Define the environment interface with D1 database binding
interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Original endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// New endpoint to fetch conferences from D1 database
app.get("/api/conferences", async (c) => {
  try {
    // Query all conferences from the database
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM conferences"
    ).all();

    // Process the results to parse the metadata JSON
    const conferences = results.map(conference => ({
      ...conference,
      metadata: typeof conference.metadata === 'string' ? JSON.parse(conference.metadata) : null
    }));

    return c.json({
      success: true,
      conferences
    });
  } catch (error) {
    console.error("Error fetching conferences:", error);
    return c.json({
      success: false,
      error: "Failed to fetch conferences"
    }, 500);
  }
});

export default app;
