import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ConferenceSchema } from '../shared/schemas';
import { db } from '../db';
import { conference } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

const app = new Hono();

// GET all conferences
app.get('/', async (c) => {
  try {
    const conferences = await db.select().from(conference);

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
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const conferences = await db
      .select()
      .from(conference)
      .where(eq(conference.id, id))
      .limit(1);

    if (conferences.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    return c.json({
      success: true,
      conference: conferences[0]
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
app.post('/', zValidator('json', ConferenceSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();
    const jwtPayload = c.get('jwtPayload');

    await db.insert(conference).values({
      id,
      name: data.name,
      startDate: data.start_date || null,
      endDate: data.end_date || null,
      location: data.location || null,
      websiteUrl: data.website_url || null,
      abstractDeadline: data.abstract_deadline || null,
      paperDeadline: data.paper_deadline || null,
      createdByUserId: jwtPayload.userId,
      metadata: data.metadata || null,
    });

    return c.json({
      success: true,
      conference: {
        id,
        name: data.name,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        location: data.location || null,
        website_url: data.website_url || null,
        abstract_deadline: data.abstract_deadline || null,
        paper_deadline: data.paper_deadline || null,
        created_by_user_id: jwtPayload.userId,
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
app.put('/:id', zValidator('json', ConferenceSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const jwtPayload = c.get('jwtPayload');

    // Check if conference exists
    const conferences = await db
      .select()
      .from(conference)
      .where(eq(conference.id, id))
      .limit(1);

    if (conferences.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    // Check if user is the creator of the conference or has admin rights
    if (conferences[0].createdByUserId !== jwtPayload.userId) {
      return c.json({
        success: false,
        error: "You don't have permission to update this conference"
      }, 403);
    }

    await db.update(conference)
      .set({
        name: data.name,
        startDate: data.start_date || null,
        endDate: data.end_date || null,
        location: data.location || null,
        websiteUrl: data.website_url || null,
        abstractDeadline: data.abstract_deadline || null,
        paperDeadline: data.paper_deadline || null,
        metadata: data.metadata || null,
      })
      .where(eq(conference.id, id));

    return c.json({
      success: true,
      conference: {
        id,
        name: data.name,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        location: data.location || null,
        website_url: data.website_url || null,
        abstract_deadline: data.abstract_deadline || null,
        paper_deadline: data.paper_deadline || null,
        created_by_user_id: conferences[0].createdByUserId,
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
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const jwtPayload = c.get('jwtPayload');

    // Check if conference exists
    const conferences = await db
      .select()
      .from(conference)
      .where(eq(conference.id, id))
      .limit(1);

    if (conferences.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    // Check if user is the creator of the conference or has admin rights
    if (conferences[0].createdByUserId !== jwtPayload.userId) {
      return c.json({
        success: false,
        error: "You don't have permission to delete this conference"
      }, 403);
    }

    await db.delete(conference).where(eq(conference.id, id));

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
