import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ResearchTopicSchema } from '../shared/schemas';
import { db } from '../db';
import { researchTopic, topicNote, userConferencePlan, conference } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

const app = new Hono();

// GET all research topics
app.get('/', async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload');

    const topics = await db
      .select()
      .from(researchTopic)
      .where(eq(researchTopic.userId, jwtPayload.userId));

    return c.json({
      success: true,
      topics
    });
  } catch (error) {
    console.error("Error fetching research topics:", error);
    return c.json({
      success: false,
      error: "Failed to fetch research topics"
    }, 500);
  }
});

// GET a specific research topic by ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const jwtPayload = c.get('jwtPayload');

    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, id),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    return c.json({
      success: true,
      topic: topics[0]
    });
  } catch (error) {
    console.error("Error fetching research topic:", error);
    return c.json({
      success: false,
      error: "Failed to fetch research topic"
    }, 500);
  }
});

// CREATE a new research topic
app.post('/', zValidator('json', ResearchTopicSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();
    const jwtPayload = c.get('jwtPayload');

    await db.insert(researchTopic).values({
      id,
      userId: jwtPayload.userId,
      topicName: data.name || data.topic_name,
      description: data.description || null,
    });

    return c.json({
      success: true,
      topic: {
        id,
        user_id: jwtPayload.userId,
        topic_name: data.name || data.topic_name,
        name: data.name || data.topic_name, // Include both for backward compatibility
        description: data.description || null,
      }
    }, 201);
  } catch (error) {
    console.error("Error creating research topic:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create research topic"
    }, 500);
  }
});

// UPDATE an existing research topic
app.put('/:id', zValidator('json', ResearchTopicSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const jwtPayload = c.get('jwtPayload');

    // Check if research topic exists and belongs to the user
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, id),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    await db.update(researchTopic)
      .set({
        topicName: data.name || data.topic_name,
        description: data.description || null,
      })
      .where(eq(researchTopic.id, id));

    return c.json({
      success: true,
      topic: {
        id,
        user_id: jwtPayload.userId,
        topic_name: data.name || data.topic_name,
        name: data.name || data.topic_name, // Include both for backward compatibility
        description: data.description || null,
      }
    });
  } catch (error) {
    console.error("Error updating research topic:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update research topic"
    }, 500);
  }
});

// DELETE a research topic
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const jwtPayload = c.get('jwtPayload');

    // Check if research topic exists and belongs to the user
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, id),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    await db.delete(researchTopic).where(eq(researchTopic.id, id));

    return c.json({
      success: true,
      message: "Research topic deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting research topic:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete research topic"
    }, 500);
  }
});

// GET detailed information about a research topic, including notes and linked conferences
app.get('/:id/detail', async (c) => {
  try {
    const id = c.req.param('id');
    const jwtPayload = c.get('jwtPayload');

    // Get the research topic
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, id),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    const topic = topics[0];

    // Get the notes for this topic
    const notes = await db
      .select()
      .from(topicNote)
      .where(eq(topicNote.topicId, id))
      .orderBy(topicNote.createdAt);

    // Get the linked conferences for this topic
    const conferencePlans = await db
      .select({
        id: userConferencePlan.id,
        topic_id: userConferencePlan.topicId,
        conference_id: userConferencePlan.conferenceId,
        paper_title: userConferencePlan.paperTitle,
        notes: userConferencePlan.notes,
        conference_name: conference.name,
        conference_start_date: conference.startDate,
        conference_paper_deadline: conference.paperDeadline,
        conference_metadata: conference.metadata,
      })
      .from(userConferencePlan)
      .innerJoin(conference, eq(userConferencePlan.conferenceId, conference.id))
      .where(eq(userConferencePlan.topicId, id));

    // Format the linked conferences
    const linkedConferences = conferencePlans.map(plan => {
      return {
        id: plan.id,
        topic_id: plan.topic_id,
        conference_id: plan.conference_id,
        paper_title: plan.paper_title,
        notes: plan.notes,
        conference: {
          id: plan.conference_id,
          name: plan.conference_name,
          start_date: plan.conference_start_date,
          paper_deadline: plan.conference_paper_deadline,
          metadata: plan.conference_metadata
        }
      };
    });

    return c.json({
      success: true,
      topic: {
        ...topic,
        notes,
        conferences: linkedConferences
      }
    });
  } catch (error) {
    console.error("Error fetching research topic detail:", error);
    return c.json({
      success: false,
      error: "Failed to fetch research topic detail"
    }, 500);
  }
});

export default app;
