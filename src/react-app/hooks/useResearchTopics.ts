import { useState, useEffect, useCallback } from 'react';
import { ResearchTopic } from '../types';

// Define the API response types for research topics
interface ResearchTopicsResponse {
  success: boolean;
  error?: string;
  topics: ResearchTopic[];
}

interface ResearchTopicResponse {
  success: boolean;
  error?: string;
  topic: ResearchTopic;
}

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
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
