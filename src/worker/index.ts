import { Hono } from "hono";
import { v4 as uuidv4 } from 'uuid';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Define the environment interface with D1 database binding
interface Env {
  DB: D1Database;
}

// Define the Variables interface for request validation
interface Variables {
  // Add any variables needed for middleware
}

// Define the Conference interface
interface Conference {
  id: string;
  name: string;
  start_date: string | null;
  paper_deadline: string | null;
  metadata: string | Record<string, any> | null;
}

// Define the validation schema for creating/updating a conference
const conferenceSchema = z.object({
  name: z.string().min(1, "Conference name is required"),
  start_date: z.string().nullable().optional(),
  paper_deadline: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Original endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Helper function to parse metadata
const parseMetadata = (conference: any): any => {
  return {
    ...conference,
    metadata: typeof conference.metadata === 'string'
      ? JSON.parse(conference.metadata)
      : conference.metadata
  };
};

// GET all conferences
app.get("/api/conferences", async (c) => {
  try {
    // Query all conferences from the database
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM conferences"
    ).all();

    // Process the results to parse the metadata JSON
    const conferences = results.map(conference => parseMetadata(conference));

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

// GET a specific conference by ID
app.get("/api/conferences/:id", async (c) => {
  try {
    const id = c.req.param('id');

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM conferences WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    const conference = parseMetadata(results[0]);

    return c.json({
      success: true,
      conference
    });
  } catch (error) {
    console.error("Error fetching conference:", error);
    return c.json({
      success: false,
      error: "Failed to fetch conference"
    }, 500);
  }
});

// CREATE a new conference
app.post("/api/conferences", zValidator("json", conferenceSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();

    // Convert metadata object to JSON string
    const metadataStr = data.metadata ? JSON.stringify(data.metadata) : null;

    const result = await c.env.DB.prepare(
      "INSERT INTO conferences (id, name, start_date, paper_deadline, metadata) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(id, data.name, data.start_date || null, data.paper_deadline || null, metadataStr)
      .run();

    if (!result.success) {
      throw new Error("Failed to insert conference");
    }

    return c.json({
      success: true,
      conference: {
        id,
        name: data.name,
        start_date: data.start_date || null,
        paper_deadline: data.paper_deadline || null,
        metadata: data.metadata || null
      }
    }, 201);
  } catch (error) {
    console.error("Error creating conference:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create conference"
    }, 500);
  }
});

// UPDATE an existing conference
app.put("/api/conferences/:id", zValidator("json", conferenceSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    // Check if conference exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM conferences WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    // Convert metadata object to JSON string
    const metadataStr = data.metadata ? JSON.stringify(data.metadata) : null;

    const result = await c.env.DB.prepare(
      "UPDATE conferences SET name = ?, start_date = ?, paper_deadline = ?, metadata = ? WHERE id = ?"
    )
      .bind(data.name, data.start_date || null, data.paper_deadline || null, metadataStr, id)
      .run();

    if (!result.success) {
      throw new Error("Failed to update conference");
    }

    return c.json({
      success: true,
      conference: {
        id,
        name: data.name,
        start_date: data.start_date || null,
        paper_deadline: data.paper_deadline || null,
        metadata: data.metadata || null
      }
    });
  } catch (error) {
    console.error("Error updating conference:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update conference"
    }, 500);
  }
});

// DELETE a conference
app.delete("/api/conferences/:id", async (c) => {
  try {
    const id = c.req.param('id');

    // Check if conference exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM conferences WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "DELETE FROM conferences WHERE id = ?"
    )
      .bind(id)
      .run();

    if (!result.success) {
      throw new Error("Failed to delete conference");
    }

    return c.json({
      success: true,
      message: "Conference deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting conference:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete conference"
    }, 500);
  }
});

export default app;
