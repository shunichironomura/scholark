import { Hono } from "hono";
import { v4 as uuidv4 } from 'uuid';
import { zValidator } from '@hono/zod-validator';
import { ConferenceSchema, ResearchTopicSchema, TopicNoteSchema, UserConferencePlanSchema, WhitelistSchema } from '../shared/schemas';
import { authMiddleware, whitelistMiddleware } from './middleware/auth';
import { createToken } from '../shared/jwt';
import { findOrCreateUser, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, isWhitelisted, GoogleUserInfo } from '../shared/auth';
import { googleAuth } from '@hono/oauth-providers/google';

// Define the environment interface with D1 database binding
interface Env {
  DB: D1Database;
}

// Define the Variables interface for request validation
interface Variables {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Original endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Authentication endpoints
// Google OAuth
app.use("/api/auth/google",
  googleAuth({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    scope: ['openid', 'email', 'profile'],
  })
);

app.get("/api/auth/google", async (c) => {
  try {
    // Get the Google user info from the middleware
    const googleUser = c.get('user-google');

    if (!googleUser || !googleUser.email) {
      return c.json({
        success: false,
        error: "Failed to get user information from Google"
      }, 500);
    }

    // Check if the user's email is whitelisted
    const isUserWhitelisted = await isWhitelisted(c.env.DB, googleUser.email);
    if (!isUserWhitelisted) {
      return c.json({
        success: false,
        error: "Your email is not whitelisted for this application"
      }, 403);
    }

    // Find or create the user in the database
    const user = await findOrCreateUser(c.env.DB, googleUser as GoogleUserInfo);

    if (!user) {
      return c.json({
        success: false,
        error: "Failed to create or find user"
      }, 500);
    }

    // Create a JWT token for the user
    const token = await createToken(user);

    // Redirect to the frontend with the token
    return c.redirect(`/?token=${token}`);
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return c.json({
      success: false,
      error: "Authentication failed"
    }, 500);
  }
});

// Get current user
app.get("/api/auth/me", authMiddleware, async (c) => {
  const user = c.get('user');

  return c.json({
    success: true,
    user
  });
});

// Whitelist management endpoints
// Get all whitelisted emails
app.get("/api/whitelist", authMiddleware, whitelistMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM whitelist ORDER BY added_at DESC"
    ).all();

    return c.json({
      success: true,
      whitelist: results
    });
  } catch (error) {
    console.error("Error fetching whitelist:", error);
    return c.json({
      success: false,
      error: "Failed to fetch whitelist"
    }, 500);
  }
});

// Add an email to the whitelist
app.post("/api/whitelist", authMiddleware, whitelistMiddleware, zValidator("json", WhitelistSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();
    const addedAt = new Date().toISOString();
    const user = c.get('user');

    if (!user || !user.id) {
      return c.json({
        success: false,
        error: "User not authenticated"
      }, 401);
    }

    // Check if email already exists in whitelist
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM whitelist WHERE email = ?"
    )
      .bind(data.email)
      .all();

    if (results.length > 0) {
      return c.json({
        success: false,
        error: "Email is already whitelisted"
      }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO whitelist (id, email, added_at, added_by) VALUES (?, ?, ?, ?)"
    )
      .bind(id, data.email, addedAt, user.id)
      .run();

    if (!result.success) {
      throw new Error("Failed to add email to whitelist");
    }

    return c.json({
      success: true,
      whitelist: {
        id,
        email: data.email,
        added_at: addedAt,
        added_by: user.id
      }
    }, 201);
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add email to whitelist"
    }, 500);
  }
});

// Remove an email from the whitelist
app.delete("/api/whitelist/:id", authMiddleware, whitelistMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    // Check if whitelist entry exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM whitelist WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Whitelist entry not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "DELETE FROM whitelist WHERE id = ?"
    )
      .bind(id)
      .run();

    if (!result.success) {
      throw new Error("Failed to remove email from whitelist");
    }

    return c.json({
      success: true,
      message: "Email removed from whitelist successfully"
    });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove email from whitelist"
    }, 500);
  }
});

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
      "SELECT * FROM conference"
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
      "SELECT * FROM conference WHERE id = ?"
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
app.post("/api/conferences", zValidator("json", ConferenceSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();

    // Convert metadata object to JSON string
    const metadataStr = data.metadata ? JSON.stringify(data.metadata) : null;

    const result = await c.env.DB.prepare(
      "INSERT INTO conference (id, name, start_date, paper_deadline, metadata) VALUES (?, ?, ?, ?, ?)"
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
app.put("/api/conferences/:id", zValidator("json", ConferenceSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    // Check if conference exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM conference WHERE id = ?"
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
      "UPDATE conference SET name = ?, start_date = ?, paper_deadline = ?, metadata = ? WHERE id = ?"
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
      "SELECT * FROM conference WHERE id = ?"
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
      "DELETE FROM conference WHERE id = ?"
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

// GET all research topics
app.get("/api/research-topics", async (c) => {
  try {
    // Query all research topics from the database
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM research_topic"
    ).all();

    return c.json({
      success: true,
      topics: results
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
app.get("/api/research-topics/:id", async (c) => {
  try {
    const id = c.req.param('id');

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    return c.json({
      success: true,
      topic: results[0]
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
app.post("/api/research-topics", zValidator("json", ResearchTopicSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const id = uuidv4();

    const result = await c.env.DB.prepare(
      "INSERT INTO research_topic (id, user_id, topic_name, description) VALUES (?, ?, ?, ?)"
    )
      .bind(id, '1', data.name || data.topic_name, data.description || null)
      .run();

    if (!result.success) {
      throw new Error("Failed to insert research topic");
    }

    return c.json({
      success: true,
      topic: {
        id,
        topic_name: data.name || data.topic_name,
        name: data.name || data.topic_name, // Include both for backward compatibility
        description: data.description || null,
        user_id: '1'
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
app.put("/api/research-topics/:id", zValidator("json", ResearchTopicSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    // Check if research topic exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "UPDATE research_topic SET topic_name = ?, description = ? WHERE id = ?"
    )
      .bind(data.name || data.topic_name, data.description || null, id)
      .run();

    if (!result.success) {
      throw new Error("Failed to update research topic");
    }

    return c.json({
      success: true,
      topic: {
        id,
        topic_name: data.name || data.topic_name,
        name: data.name || data.topic_name, // Include both for backward compatibility
        description: data.description || null,
        user_id: '1'
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
app.delete("/api/research-topics/:id", async (c) => {
  try {
    const id = c.req.param('id');

    // Check if research topic exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "DELETE FROM research_topic WHERE id = ?"
    )
      .bind(id)
      .run();

    if (!result.success) {
      throw new Error("Failed to delete research topic");
    }

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
app.get("/api/research-topics/:id/detail", async (c) => {
  try {
    const id = c.req.param('id');

    // Get the research topic
    const { results: topicResults } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(id)
      .all();

    if (topicResults.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    const topic = topicResults[0];

    // Get the notes for this topic
    const { results: noteResults } = await c.env.DB.prepare(
      "SELECT * FROM topic_note WHERE topic_id = ? ORDER BY created_at DESC"
    )
      .bind(id)
      .all();

    // Get the linked conferences for this topic
    const { results: conferenceResults } = await c.env.DB.prepare(`
      SELECT tc.*, c.name, c.start_date, c.paper_deadline, c.metadata
      FROM user_conference_plan tc
      JOIN conference c ON tc.conference_id = c.id
      WHERE tc.topic_id = ?
    `)
      .bind(id)
      .all();

    // Process the results to parse the metadata JSON
    const linkedConferences = conferenceResults.map(result => {
      const { id, topic_id, conference_id, paper_title, notes, name, start_date, paper_deadline, metadata } = result;
      return {
        id,
        topic_id,
        conference_id,
        paper_title,
        notes,
        conference: parseMetadata({
          id: conference_id,
          name,
          start_date,
          paper_deadline,
          metadata
        })
      };
    });

    return c.json({
      success: true,
      topic: {
        ...topic,
        notes: noteResults,
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

// GET all notes for a research topic
app.get("/api/research-topics/:id/notes", async (c) => {
  try {
    const topicId = c.req.param('id');

    // Check if research topic exists
    const { results: topicResults } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(topicId)
      .all();

    if (topicResults.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    // Get all notes for this topic
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM topic_note WHERE topic_id = ? ORDER BY created_at DESC"
    )
      .bind(topicId)
      .all();

    return c.json({
      success: true,
      notes: results
    });
  } catch (error) {
    console.error("Error fetching topic notes:", error);
    return c.json({
      success: false,
      error: "Failed to fetch topic notes"
    }, 500);
  }
});

// CREATE a new note for a research topic
app.post("/api/research-topics/:id/notes", zValidator("json", TopicNoteSchema), async (c) => {
  try {
    const topicId = c.req.param('id');
    const data = c.req.valid('json');
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    // Check if research topic exists
    const { results: topicResults } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(topicId)
      .all();

    if (topicResults.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO topic_note (id, topic_id, content, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(id, topicId, data.content, createdAt)
      .run();

    if (!result.success) {
      throw new Error("Failed to insert topic note");
    }

    return c.json({
      success: true,
      note: {
        id,
        topic_id: topicId,
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
app.put("/api/topic-notes/:id", zValidator("json", TopicNoteSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    // Check if note exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM topic_note WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Note not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "UPDATE topic_note SET content = ? WHERE id = ?"
    )
      .bind(data.content, id)
      .run();

    if (!result.success) {
      throw new Error("Failed to update note");
    }

    return c.json({
      success: true,
      note: {
        ...results[0],
        content: data.content
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
app.delete("/api/topic-notes/:id", async (c) => {
  try {
    const id = c.req.param('id');

    // Check if note exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM topic_note WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Note not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "DELETE FROM topic_note WHERE id = ?"
    )
      .bind(id)
      .run();

    if (!result.success) {
      throw new Error("Failed to delete note");
    }

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

// GET all linked conferences for a research topic
app.get("/api/research-topics/:id/conferences", async (c) => {
  try {
    const topicId = c.req.param('id');

    // Check if research topic exists
    const { results: topicResults } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(topicId)
      .all();

    if (topicResults.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    // Get all linked conferences for this topic
    const { results } = await c.env.DB.prepare(`
      SELECT tc.*, c.name, c.start_date, c.paper_deadline, c.metadata
      FROM user_conference_plan tc
      JOIN conference c ON tc.conference_id = c.id
      WHERE tc.topic_id = ?
    `)
      .bind(topicId)
      .all();

    // Process the results to parse the metadata JSON
    const linkedConferences = results.map(result => {
      const { id, topic_id, conference_id, paper_title, notes, name, start_date, paper_deadline, metadata } = result;
      return {
        id,
        topic_id,
        conference_id,
        paper_title,
        notes,
        conference: parseMetadata({
          id: conference_id,
          name,
          start_date,
          paper_deadline,
          metadata
        })
      };
    });

    return c.json({
      success: true,
      topicConferences: linkedConferences
    });
  } catch (error) {
    console.error("Error fetching topic conferences:", error);
    return c.json({
      success: false,
      error: "Failed to fetch topic conferences"
    }, 500);
  }
});

// LINK a conference to a research topic
app.post("/api/research-topics/:id/conferences", zValidator("json", UserConferencePlanSchema), async (c) => {
  try {
    const topicId = c.req.param('id');
    const data = c.req.valid('json');
    const id = uuidv4();

    // Check if research topic exists
    const { results: topicResults } = await c.env.DB.prepare(
      "SELECT * FROM research_topic WHERE id = ?"
    )
      .bind(topicId)
      .all();

    if (topicResults.length === 0) {
      return c.json({
        success: false,
        error: "Research topic not found"
      }, 404);
    }

    // Check if conference exists
    const { results: conferenceResults } = await c.env.DB.prepare(
      "SELECT * FROM conference WHERE id = ?"
    )
      .bind(data.conference_id)
      .all();

    if (conferenceResults.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    // Check if the link already exists
    const { results: existingResults } = await c.env.DB.prepare(
      "SELECT * FROM user_conference_plan WHERE topic_id = ? AND conference_id = ?"
    )
      .bind(topicId, data.conference_id)
      .all();

    if (existingResults.length > 0) {
      return c.json({
        success: false,
        error: "Conference is already linked to this topic"
      }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO user_conference_plan (id, topic_id, conference_id, paper_title, notes) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(id, topicId, data.conference_id, data.paper_title || null, data.notes || null)
      .run();

    if (!result.success) {
      throw new Error("Failed to link conference to topic");
    }

    return c.json({
      success: true,
      topicConference: {
        id,
        topic_id: topicId,
        conference_id: data.conference_id,
        paper_title: data.paper_title || null,
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
app.put("/api/topic-conferences/:id", zValidator("json", UserConferencePlanSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    // Check if topic-conference link exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM user_conference_plan WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Topic-conference link not found"
      }, 404);
    }

    // Check if conference exists
    const { results: conferenceResults } = await c.env.DB.prepare(
      "SELECT * FROM conference WHERE id = ?"
    )
      .bind(data.conference_id)
      .all();

    if (conferenceResults.length === 0) {
      return c.json({
        success: false,
        error: "Conference not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "UPDATE user_conference_plan SET conference_id = ?, paper_title = ?, notes = ? WHERE id = ?"
    )
      .bind(data.conference_id, data.paper_title || null, data.notes || null, id)
      .run();

    if (!result.success) {
      throw new Error("Failed to update topic-conference link");
    }

    return c.json({
      success: true,
      topicConference: {
        id,
        topic_id: results[0].topic_id,
        conference_id: data.conference_id,
        paper_title: data.paper_title || null,
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
app.delete("/api/topic-conferences/:id", async (c) => {
  try {
    const id = c.req.param('id');

    // Check if topic-conference link exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM user_conference_plan WHERE id = ?"
    )
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({
        success: false,
        error: "Topic-conference link not found"
      }, 404);
    }

    const result = await c.env.DB.prepare(
      "DELETE FROM user_conference_plan WHERE id = ?"
    )
      .bind(id)
      .run();

    if (!result.success) {
      throw new Error("Failed to delete topic-conference link");
    }

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
