import { useState, useEffect, useCallback } from 'react';
import { Conference, ConferencesResponse, ConferenceResponse } from '../../shared/schemas';

export function useConferences() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conferences
  const fetchConferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/conferences');
      const data = await response.json() as ConferencesResponse;

      if (data.success) {
        setConferences(data.conferences);
      } else {
        setError(data.error || 'Failed to fetch conferences');
      }
    } catch (err) {
      setError('Error fetching conferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single conference by ID
  const fetchConference = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conferences/${id}`);
      const data = await response.json() as ConferenceResponse;

      if (data.success) {
        return data.conference;
      } else {
        setError(data.error || 'Failed to fetch conference');
        return null;
      }
    } catch (err) {
      setError('Error fetching conference');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new conference
  const createConference = useCallback(async (conference: Omit<Conference, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/conferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conference),
      });

      const data = await response.json() as ConferenceResponse;

      if (data.success) {
        setConferences(prev => [...prev, data.conference]);
        return data.conference;
      } else {
        setError(data.error || 'Failed to create conference');
        return null;
      }
    } catch (err) {
      setError('Error creating conference');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing conference
  const updateConference = useCallback(async (id: string, conference: Partial<Conference>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conferences/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conference),
      });

      const data = await response.json() as ConferenceResponse;

      if (data.success) {
        setConferences(prev =>
          prev.map(conf => conf.id === id ? data.conference : conf)
        );
        return data.conference;
      } else {
        setError(data.error || 'Failed to update conference');
        return null;
      }
    } catch (err) {
      setError('Error updating conference');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a conference
  const deleteConference = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conferences/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setConferences(prev => prev.filter(conf => conf.id !== id));
        return true;
      } else {
        setError(data.error || 'Failed to delete conference');
        return false;
      }
    } catch (err) {
      setError('Error deleting conference');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load conferences on initial mount
  useEffect(() => {
    fetchConferences();
  }, [fetchConferences]);

  return {
    conferences,
    loading,
    error,
    fetchConferences,
    fetchConference,
    createConference,
    updateConference,
    deleteConference,
  };
}
