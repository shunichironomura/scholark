import { useState, useEffect } from 'react';
import { useConferences } from '../hooks/useConferences';
import { useResearchTopics } from '../hooks/useResearchTopics';
// No need to import UserConferencePlan as we're using the local TopicConference interface

// Define the schedule item interface
interface ScheduleItem {
  id: string;
  date: Date;
  type: 'conference_start' | 'conference_end' | 'paper_deadline' | 'abstract_deadline';
  title: string;
  conferenceId: string;
  conferenceName: string;
  description?: string;
}

// Define a type for the conference data we receive from the API
interface TopicConference {
  id: string;
  conference_id: string;
  topic_id: string | null;
  paper_title: string | null;
  notes: string | null;
  conference?: {
    id?: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    website_url: string | null;
    abstract_deadline: string | null;
    paper_deadline: string | null;
    metadata: Record<string, any> | null;
  };
}


// Helper function to get days remaining
const getDaysRemaining = (dateString: string | null): string => {
  if (!dateString) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Past';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `${diffDays} days left`;
  }
};

// Helper function to get month and year from date
const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export function SchedulePage() {
  const { conferences, loading: conferencesLoading, error: conferencesError } = useConferences();
  const {
    topics,
    loading: topicsLoading,
    error: topicsError,
    fetchTopicConferences
  } = useResearchTopics();

  const [linkedConferenceIds, setLinkedConferenceIds] = useState<Set<string>>(new Set());
  // Using underscore prefix to indicate intentionally unused variable
  const [_scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch linked conferences for all research topics
  useEffect(() => {
    const fetchLinkedConferences = async () => {
      console.log("fetchLinkedConferences called, topics:", topics);
      if (topics.length === 0) {
        console.log("No topics found, returning early");
        return;
      }

      try {
        const conferenceIds = new Set<string>();

        // For each topic, fetch linked conferences
        for (const topic of topics) {
          // Get the display name from either name or topic_name property
          const displayName = topic.name || (topic as any).topic_name || "Research Topic";
          const topicId = topic.id || '';
          console.log("Fetching conferences for topic:", topicId, displayName);
          const topicConferences = await fetchTopicConferences(topicId);
          console.log("Topic conferences result:", topicConferences);
          if (topicConferences) {
            // Add conference IDs to the set
            topicConferences.forEach((tc: TopicConference) => {
              console.log("Adding conference ID to set:", tc.conference_id);
              conferenceIds.add(tc.conference_id);
            });
          }
        }

        console.log("Final linked conference IDs:", Array.from(conferenceIds));
        setLinkedConferenceIds(conferenceIds);
      } catch (err) {
        console.log("Error in fetchLinkedConferences:", err);
        setError('Error fetching linked conferences');
        console.error(err);
      }
    };

    fetchLinkedConferences();
  }, [topics, fetchTopicConferences]);

  // Process conferences into schedule items
  useEffect(() => {
    console.log("Processing conferences effect triggered");
    console.log("Conferences:", conferences);
    console.log("Linked conference IDs:", Array.from(linkedConferenceIds));
    console.log("Loading states:", { conferencesLoading, topicsLoading });

    setLoading(conferencesLoading || topicsLoading);

    if (conferencesError) {
      console.log("Conferences error:", conferencesError);
      setError(conferencesError);
    }
    if (topicsError) {
      console.log("Topics error:", topicsError);
      setError(topicsError);
    }

    if (conferences.length > 0 && linkedConferenceIds.size > 0) {
      console.log("Processing conferences and linked IDs");
      const items: ScheduleItem[] = [];

      // Filter conferences to only include those linked to research topics
      const filteredConferences = conferences.filter(conf =>
        conf.id && linkedConferenceIds.has(conf.id)
      );
      console.log("Filtered conferences:", filteredConferences);

      filteredConferences.forEach(conference => {
        const confId = conference.id || '';
        console.log("Processing conference:", confId, conference.name);

        // Add conference start date
        if (conference.start_date) {
          console.log("Adding start date item:", conference.start_date);
          items.push({
            id: `${confId}-start`,
            date: new Date(conference.start_date),
            type: 'conference_start',
            title: `Conference: ${conference.name}`,
            conferenceId: confId,
            conferenceName: conference.name,
            description: conference.location ? `Location: ${conference.location}` : undefined
          });
        }

        // Add conference end date if available
        if (conference.end_date) {
          console.log("Adding end date item:", conference.end_date);
          items.push({
            id: `${confId}-end`,
            date: new Date(conference.end_date),
            type: 'conference_end',
            title: `Conference Ends: ${conference.name}`,
            conferenceId: confId,
            conferenceName: conference.name
          });
        }

        // Add paper deadline
        if (conference.paper_deadline) {
          console.log("Adding paper deadline item:", conference.paper_deadline);
          items.push({
            id: `${confId}-paper`,
            date: new Date(conference.paper_deadline),
            type: 'paper_deadline',
            title: `Paper Deadline: ${conference.name}`,
            conferenceId: confId,
            conferenceName: conference.name
          });
        }

        // Add abstract deadline if available
        if (conference.abstract_deadline) {
          console.log("Adding abstract deadline item:", conference.abstract_deadline);
          items.push({
            id: `${confId}-abstract`,
            date: new Date(conference.abstract_deadline),
            type: 'abstract_deadline',
            title: `Abstract Deadline: ${conference.name}`,
            conferenceId: confId,
            conferenceName: conference.name
          });
        }
      });

      console.log("All schedule items before sorting:", items);

      // Sort items by date
      const sortedItems = items.sort((a, b) => a.date.getTime() - b.date.getTime());
      console.log("Sorted schedule items:", sortedItems);
      setScheduleItems(sortedItems);

      // Group items by month and year
      const grouped: Record<string, ScheduleItem[]> = {};
      sortedItems.forEach(item => {
        const monthYear = getMonthYear(item.date);
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(item);
      });

      console.log("Grouped items by month/year:", grouped);
      setGroupedItems(grouped);
      setLoading(false);
    } else if (!conferencesLoading && !topicsLoading) {
      console.log("No items to process, setting loading to false");
      // If we're done loading but have no items, make sure we're not showing loading state
      setLoading(false);
    }
  }, [conferences, linkedConferenceIds, conferencesLoading, topicsLoading, conferencesError, topicsError]);

  // Render icon based on event type
  const renderIcon = (type: string) => {
    switch (type) {
      case 'conference_start':
        return <span className="text-blue-500">🎯</span>;
      case 'conference_end':
        return <span className="text-blue-300">🏁</span>;
      case 'paper_deadline':
        return <span className="text-red-500">📝</span>;
      case 'abstract_deadline':
        return <span className="text-orange-500">📋</span>;
      default:
        return <span className="text-gray-500">📅</span>;
    }
  };

  // Get status badge class based on days remaining
  const getStatusBadgeClass = (daysRemaining: string) => {
    if (daysRemaining === 'Past') {
      return 'bg-gray-200 text-gray-800';
    } else if (daysRemaining === 'Today' || daysRemaining === 'Tomorrow') {
      return 'bg-red-100 text-red-800';
    } else if (daysRemaining.includes('days left') && parseInt(daysRemaining) <= 7) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading schedule...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  if (topics.length === 0) {
    return (
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Schedule</h1>
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No research topics found.</p>
          <p className="mt-2">Add research topics and link conferences to see important dates here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Schedule</h1>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No scheduled events found for your research topics.</p>
          <p className="mt-2">Link conferences to your research topics to see their important dates here.</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([monthYear, items]) => (
          <div key={monthYear} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">{monthYear}</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{renderIcon(item.type)}</div>
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          {item.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(getDaysRemaining(item.date.toISOString()))}`}
                    >
                      {getDaysRemaining(item.date.toISOString())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
