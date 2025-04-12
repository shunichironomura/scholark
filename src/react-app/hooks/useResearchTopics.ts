import { useState, useEffect, useCallback } from 'react';
import {
  ResearchTopic,
  ResearchTopicsResponse,
  ResearchTopicResponse,
  TopicNotesResponse,
  TopicNoteResponse,
  UserConferencePlan,
  ApiResponseSchema,
} from '../../shared/schemas';
import { z } from 'zod';

// Define missing response types based on the pattern in schemas.ts
const ResearchTopicDetailResponseSchema = ApiResponseSchema.extend({
  topic: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    notes: z.array(z.object({
      id: z.string(),
      topic_id: z.string(),
      content: z.string(),
      created_at: z.string(),
    })),
    conferences: z.array(z.object({
      id: z.string(),
      conference_id: z.string(),
      topic_id: z.string().nullable(),
      paper_title: z.string().nullable(),
      bibtex: z.string().nullable(),
      github_link: z.string().nullable(),
      submission_status: z.string(),
      notes: z.string().nullable(),
    })),
  }),
});

const UserConferencePlansResponseSchema = ApiResponseSchema.extend({
  plans: z.array(z.object({
    id: z.string(),
    conference_id: z.string(),
    topic_id: z.string().nullable(),
    paper_title: z.string().nullable(),
    bibtex: z.string().nullable(),
    github_link: z.string().nullable(),
    submission_status: z.string(),
    notes: z.string().nullable(),
  })),
});

const UserConferencePlanResponseSchema = ApiResponseSchema.extend({
  plan: z.object({
    id: z.string(),
    conference_id: z.string(),
    topic_id: z.string().nullable(),
    paper_title: z.string().nullable(),
    bibtex: z.string().nullable(),
    github_link: z.string().nullable(),
    submission_status: z.string(),
    notes: z.string().nullable(),
  }),
});

// Export inferred types
type ResearchTopicDetailResponse = z.infer<typeof ResearchTopicDetailResponseSchema>;
type UserConferencePlansResponse = z.infer<typeof UserConferencePlansResponseSchema>;
type UserConferencePlanResponse = z.infer<typeof UserConferencePlanResponseSchema>;

export function useResearchTopics() {
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all research topics
  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/research-topics');
      const data = await response.json() as ResearchTopicsResponse;

      if (data.success) {
        setTopics(data.topics);
      } else {
        setError(data.error || 'Failed to fetch research topics');
      }
    } catch (err) {
      setError('Error fetching research topics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single research topic by ID
  const fetchTopic = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${id}`);
      const data = await response.json() as ResearchTopicResponse;

      if (data.success) {
        return data.topic;
      } else {
        setError(data.error || 'Failed to fetch research topic');
        return null;
      }
    } catch (err) {
      setError('Error fetching research topic');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detailed information about a research topic, including notes and linked conferences
  const fetchTopicDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${id}/detail`);
      const data = await response.json() as ResearchTopicDetailResponse;

      if (data.success) {
        return data.topic;
      } else {
        setError(data.error || 'Failed to fetch research topic details');
        return null;
      }
    } catch (err) {
      setError('Error fetching research topic details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new research topic
  const createTopic = useCallback(async (topic: Omit<ResearchTopic, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/research-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });

      const data = await response.json() as ResearchTopicResponse;

      if (data.success) {
        setTopics(prev => [...prev, data.topic]);
        return data.topic;
      } else {
        setError(data.error || 'Failed to create research topic');
        return null;
      }
    } catch (err) {
      setError('Error creating research topic');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing research topic
  const updateTopic = useCallback(async (id: string, topic: Partial<ResearchTopic>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });

      const data = await response.json() as ResearchTopicResponse;

      if (data.success) {
        setTopics(prev =>
          prev.map(t => t.id === id ? data.topic : t)
        );
        return data.topic;
      } else {
        setError(data.error || 'Failed to update research topic');
        return null;
      }
    } catch (err) {
      setError('Error updating research topic');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a research topic
  const deleteTopic = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setTopics(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        setError(data.error || 'Failed to delete research topic');
        return false;
      }
    } catch (err) {
      setError('Error deleting research topic');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all notes for a research topic
  const fetchTopicNotes = useCallback(async (topicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${topicId}/notes`);
      const data = await response.json() as TopicNotesResponse;

      if (data.success) {
        return data.notes;
      } else {
        setError(data.error || 'Failed to fetch topic notes');
        return null;
      }
    } catch (err) {
      setError('Error fetching topic notes');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new note for a research topic
  const createTopicNote = useCallback(async (topicId: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${topicId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json() as TopicNoteResponse;

      if (data.success) {
        return data.note;
      } else {
        setError(data.error || 'Failed to create topic note');
        return null;
      }
    } catch (err) {
      setError('Error creating topic note');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a note
  const updateTopicNote = useCallback(async (noteId: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/topic-notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json() as TopicNoteResponse;

      if (data.success) {
        return data.note;
      } else {
        setError(data.error || 'Failed to update topic note');
        return null;
      }
    } catch (err) {
      setError('Error updating topic note');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a note
  const deleteTopicNote = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/topic-notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || 'Failed to delete topic note');
        return false;
      }
    } catch (err) {
      setError('Error deleting topic note');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all linked conferences for a research topic
  const fetchTopicConferences = useCallback(async (topicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${topicId}/conferences`);
      const data = await response.json() as UserConferencePlansResponse;

      if (data.success) {
        return data.plans;
      } else {
        setError(data.error || 'Failed to fetch topic conferences');
        return null;
      }
    } catch (err) {
      setError('Error fetching topic conferences');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Link a conference to a research topic
  const linkConferenceToTopic = useCallback(async (
    topicId: string,
    conferenceId: string,
    paperTitle?: string,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-topics/${topicId}/conferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conference_id: conferenceId,
          paper_title: paperTitle || null,
          notes: notes || null,
        }),
      });

      const data = await response.json() as UserConferencePlanResponse;

      if (data.success) {
        return data.plan;
      } else {
        setError(data.error || 'Failed to link conference to topic');
        return null;
      }
    } catch (err) {
      setError('Error linking conference to topic');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a topic-conference link
  const updateTopicConference = useCallback(async (
    linkId: string,
    conferenceId: string,
    paperTitle?: string,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/topic-conferences/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conference_id: conferenceId,
          paper_title: paperTitle || null,
          notes: notes || null,
        }),
      });

      const data = await response.json() as UserConferencePlanResponse;

      if (data.success) {
        return data.plan;
      } else {
        setError(data.error || 'Failed to update topic-conference link');
        return null;
      }
    } catch (err) {
      setError('Error updating topic-conference link');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a topic-conference link
  const deleteTopicConference = useCallback(async (linkId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/topic-conferences/${linkId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || 'Failed to delete topic-conference link');
        return false;
      }
    } catch (err) {
      setError('Error deleting topic-conference link');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load research topics on initial mount
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,
    loading,
    error,
    fetchTopics,
    fetchTopic,
    fetchTopicDetail,
    createTopic,
    updateTopic,
    deleteTopic,
    fetchTopicNotes,
    createTopicNote,
    updateTopicNote,
    deleteTopicNote,
    fetchTopicConferences,
    linkConferenceToTopic,
    updateTopicConference,
    deleteTopicConference,
  };
}
