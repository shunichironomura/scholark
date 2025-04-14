import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { TopicNoteSchema } from '../../shared/schemas';
import { db } from '../db/index';
import { topicNote, researchTopic } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

const app = new Hono();

// CREATE a new note for a research topic
app.post('/', zValidator('json', TopicNoteSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();
    const jwtPayload = c.get('jwtPayload');
    const createdAt = new Date().toISOString();

    // Check if research topic exists and belongs to the user
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, data.topic_id),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found or you don't have access to it"
      }, 404);
    }

    await db.insert(topicNote).values({
      id,
      topicId: data.topic_id,
      content: data.content,
      createdAt,
    });

    return c.json({
      success: true,
      note: {
        id,
        topic_id: data.topic_id,
        content: data.content,
        created_at: createdAt
      }
    }, 201);
  } catch (error) {
    console.error("Error creating topic note:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create topic note"
    }, 500);
  }
});

// UPDATE a note
app.put('/:id', zValidator('json', TopicNoteSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const jwtPayload = c.get('jwtPayload');

    // Get the note
    const notes = await db
      .select()
      .from(topicNote)
      .where(eq(topicNote.id, id))
      .limit(1);

    if (notes.length === 0) {
      return c.json({
        success: false,
        error: "Note not found"
      }, 404);
    }

    // Check if the topic belongs to the user
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, notes[0].topicId),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "You don't have permission to update this note"
      }, 403);
    }

    await db.update(topicNote)
      .set({
        content: data.content,
      })
      .where(eq(topicNote.id, id));

    return c.json({
      success: true,
      note: {
        id,
        topic_id: notes[0].topicId,
        content: data.content,
        created_at: notes[0].createdAt
      }
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update note"
    }, 500);
  }
});

// DELETE a note
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const jwtPayload = c.get('jwtPayload');

    // Get the note
    const notes = await db
      .select()
      .from(topicNote)
      .where(eq(topicNote.id, id))
      .limit(1);

    if (notes.length === 0) {
      return c.json({
        success: false,
        error: "Note not found"
      }, 404);
    }

    // Check if the topic belongs to the user
    const topics = await db
      .select()
      .from(researchTopic)
      .where(and(
        eq(researchTopic.id, notes[0].topicId),
        eq(researchTopic.userId, jwtPayload.userId)
      ))
      .limit(1);

    if (topics.length === 0) {
      return c.json({
        success: false,
        error: "You don't have permission to delete this note"
      }, 403);
    }

    await db.delete(topicNote).where(eq(topicNote.id, id));

    return c.json({
      success: true,
      message: "Note deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete note"
    }, 500);
  }
});

export default app;
