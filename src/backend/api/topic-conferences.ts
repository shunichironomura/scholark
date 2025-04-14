import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserConferencePlanSchema } from '../../shared/schemas';
import { db } from '../db/index';
import { userConferencePlan, researchTopic, conference } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

const app = new Hono();

// LINK a conference to a research topic
app.post('/', zValidator('json', UserConferencePlanSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();
    const jwtPayload = c.get('jwtPayload');

    // Check if research topic exists and belongs to the user
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, data.topic_id || ""),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found or you don't have access to it"
      }, 404);
    }

    // Check if conference exists
    const conferences = await db
      .select()
      .from(conference)
      .where(eq(conference.id, data.conference_id))
      .limit(1);

    if (conferences.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    // Check if the link already exists
    const existingLinks = await db
      .select()
      .from(userConferencePlan)
      .where(and(
        eq(userConferencePlan.topicId, data.topic_id || ""),
        eq(userConferencePlan.conferenceId, data.conference_id || ""),
        eq(userConferencePlan.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (existingLinks.length > 0) {
      return c.json({
        success: false,
        error: "Conference is already linked to this topic"
      }, 400);
    }

    await db.insert(userConferencePlan).values({
      id,
      userId: jwtPayload.userId,
      topicId: data.topic_id,
      conferenceId: data.conference_id,
      paperTitle: data.paper_title || null,
      bibtex: data.bibtex || null,
      githubLink: data.github_link || null,
      submissionStatus: data.submission_status || 'Planning',
      notes: data.notes || null,
    });

    return c.json({
      success: true,
      topicConference: {
        id,
        user_id: jwtPayload.userId,
        topic_id: data.topic_id,
        conference_id: data.conference_id,
        paper_title: data.paper_title || null,
        bibtex: data.bibtex || null,
        github_link: data.github_link || null,
        submission_status: data.submission_status || 'Planning',
        notes: data.notes || null
      }
    }, 201);
  } catch (error) {
    console.error("Error linking conference to topic:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to link conference to topic"
    }, 500);
  }
});

// UPDATE a topic-conference link
app.put('/:id', zValidator('json', UserConferencePlanSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const jwtPayload = c.get('jwtPayload');

    // Check if topic-conference link exists and belongs to the user
    const links = await db
      .select()
      .from(userConferencePlan)
      .where(and(
        eq(userConferencePlan.id, id),
        eq(userConferencePlan.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (links.length === 0) {
      return c.json({
        success: false,
        error: "Topic-conference link not found or you don't have access to it"
      }, 404);
    }

    // Check if conference exists
    const conferences = await db
      .select()
      .from(conference)
      .where(eq(conference.id, data.conference_id))
      .limit(1);

    if (conferences.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    await db.update(userConferencePlan)
      .set({
        conferenceId: data.conference_id,
        paperTitle: data.paper_title || null,
        bibtex: data.bibtex || null,
        githubLink: data.github_link || null,
        submissionStatus: data.submission_status || 'Planning',
        notes: data.notes || null,
      })
      .where(eq(userConferencePlan.id, id));

    return c.json({
      success: true,
      topicConference: {
        id,
        user_id: jwtPayload.userId,
        topic_id: links[0].topicId,
        conference_id: data.conference_id,
        paper_title: data.paper_title || null,
        bibtex: data.bibtex || null,
        github_link: data.github_link || null,
        submission_status: data.submission_status || 'Planning',
        notes: data.notes || null
      }
    });
  } catch (error) {
    console.error("Error updating topic-conference link:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update topic-conference link"
    }, 500);
  }
});

// DELETE a topic-conference link
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const jwtPayload = c.get('jwtPayload');

    // Check if topic-conference link exists and belongs to the user
    const links = await db
      .select()
      .from(userConferencePlan)
      .where(and(
        eq(userConferencePlan.id, id),
        eq(userConferencePlan.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (links.length === 0) {
      return c.json({
        success: false,
        error: "Topic-conference link not found or you don't have access to it"
      }, 404);
    }

    await db.delete(userConferencePlan).where(eq(userConferencePlan.id, id));

    return c.json({
      success: true,
      message: "Topic-conference link deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting topic-conference link:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete topic-conference link"
    }, 500);
  }
});

export default app;
