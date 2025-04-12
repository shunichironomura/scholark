import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResearchTopics } from '../hooks/useResearchTopics';
import { useConferences } from '../hooks/useConferences';
import { TopicNote } from '../../shared/schemas';
import { Modal } from '../components/Modal';

// Define the TopicConference interface to match the API response
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

// Define the ResearchTopicDetail interface
interface ResearchTopicDetail {
  id: string;
  name?: string;
  topic_name?: string;
  description: string | null;
  notes: TopicNote[];
  conferences: Array<TopicConference>;
}

export function ResearchTopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    loading,
    error,
    fetchTopicDetail,
    createTopicNote,
    updateTopicNote,
    deleteTopicNote,
    linkConferenceToTopic,
    updateTopicConference,
    deleteTopicConference,
  } = useResearchTopics();
  const { conferences, fetchConferences } = useConferences();

  const [topic, setTopic] = useState<ResearchTopicDetail | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<TopicNote | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showLinkConferenceModal, setShowLinkConferenceModal] = useState(false);
  const [selectedConference, setSelectedConference] = useState<string>('');
  const [paperTitle, setPaperTitle] = useState('');
  const [conferenceNotes, setConferenceNotes] = useState('');
  const [editingLink, setEditingLink] = useState<string | null>(null);

  // Fetch topic details and conferences on component mount
  useEffect(() => {
    if (id) {
      loadTopicDetail();
      fetchConferences();
    } else {
      navigate('/research-topics');
    }
  }, [id, navigate, fetchConferences]);

  // Load topic detail
  const loadTopicDetail = async () => {
    if (id) {
      console.log("Fetching topic detail for ID:", id);
      const topicDetail = await fetchTopicDetail(id);
      console.log("Topic detail response:", topicDetail);
      if (topicDetail) {
        setTopic(topicDetail);
        console.log("Topic state set:", topicDetail);
      } else {
        console.log("Topic detail is null or undefined");
      }
    } else {
      console.log("No ID provided");
    }
  };

  // Handle adding a new note
  const handleAddNote = async () => {
    if (id && noteContent.trim()) {
      const result = await createTopicNote(id, noteContent);
      if (result) {
        setNoteContent('');
        setShowAddNoteModal(false);
        loadTopicDetail();
      }
    }
  };

  // Handle updating a note
  const handleUpdateNote = async () => {
    if (editingNote && noteContent.trim()) {
      const result = await updateTopicNote(editingNote.id, noteContent);
      if (result) {
        setNoteContent('');
        setEditingNote(null);
        loadTopicDetail();
      }
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const result = await deleteTopicNote(noteId);
      if (result) {
        loadTopicDetail();
      }
    }
  };

  // Handle linking a conference to the topic
  const handleLinkConference = async () => {
    if (id && selectedConference) {
      const result = await linkConferenceToTopic(
        id,
        selectedConference,
        paperTitle || undefined,
        conferenceNotes || undefined
      );
      if (result) {
        setSelectedConference('');
        setPaperTitle('');
        setConferenceNotes('');
        setShowLinkConferenceModal(false);
        loadTopicDetail();
      }
    }
  };

  // Handle updating a conference link
  const handleUpdateLink = async () => {
    if (id && editingLink && selectedConference) {
      const result = await updateTopicConference(
        editingLink,
        selectedConference,
        paperTitle || undefined,
        conferenceNotes || undefined
      );
      if (result) {
        setSelectedConference('');
        setPaperTitle('');
        setConferenceNotes('');
        setEditingLink(null);
        setShowLinkConferenceModal(false);
        loadTopicDetail();
      }
    }
  };

  // Handle deleting a conference link
  const handleDeleteLink = async (linkId: string) => {
    if (window.confirm('Are you sure you want to unlink this conference?')) {
      const result = await deleteTopicConference(linkId);
      if (result) {
        loadTopicDetail();
      }
    }
  };

  // Start editing a note
  const startEditingNote = (note: TopicNote) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setShowAddNoteModal(true);
  };

  // Start editing a conference link
  const startEditingLink = (linkId: string, conferenceId: string, title?: string, notes?: string) => {
    setEditingLink(linkId);
    setSelectedConference(conferenceId);
    setPaperTitle(title || '');
    setConferenceNotes(notes || '');
    setShowLinkConferenceModal(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!topic) {
    return <div className="p-4">Research topic not found</div>;
  }

  // Log when component renders
  console.log("Rendering ResearchTopicDetailPage, topic:", topic);
  console.log("Topic name:", topic?.name);
  console.log("Topic ID:", topic?.id);

  // Access topic_name using type assertion to avoid TypeScript errors
  const topicName = (topic as any).topic_name;
  console.log("Topic topic_name:", topicName);

  // Get the display name from either name or topic_name property
  const displayName = topic?.name || topicName || "Research Topic";

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">
          {displayName}
          <span className="ml-2">({topic.id})</span>
        </h1>
        <button
          onClick={() => navigate('/research-topics')}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Topics
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="p-4 bg-gray-100 rounded-md">{topic.description || 'No description provided.'}</p>
      </div>

      {/* Notes Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Notes</h2>
          <button
            onClick={() => {
              setEditingNote(null);
              setNoteContent('');
              setShowAddNoteModal(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Note
          </button>
        </div>
        {topic.notes && topic.notes.length > 0 ? (
          <div className="space-y-4">
            {topic.notes.map((note: TopicNote) => (
              <div key={note.id} className="p-4 bg-white border rounded-md shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Created: {formatDate(note.created_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditingNote(note)}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 bg-gray-100 rounded-md">No notes yet. Add your first note!</p>
        )}
      </div>

      {/* Linked Conferences Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Linked Conferences</h2>
          <button
            onClick={() => {
              setEditingLink(null);
              setSelectedConference('');
              setPaperTitle('');
              setConferenceNotes('');
              setShowLinkConferenceModal(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Link Conference
          </button>
        </div>
        {topic.conferences && topic.conferences.length > 0 ? (
          <div className="space-y-4">
            {topic.conferences.map((link: TopicConference) => (
              <div key={link.id} className="p-4 bg-white border rounded-md shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {link.conference ? link.conference.name : `Conference ID: ${link.conference_id}`}
                    </h3>
                    {link.paper_title && (
                      <p className="font-medium mt-1">Paper: {link.paper_title}</p>
                    )}
                    {link.notes && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm whitespace-pre-wrap">{link.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditingLink(link.id, link.conference_id, link.paper_title || undefined, link.notes || undefined)}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 bg-gray-100 rounded-md">No conferences linked yet. Link your first conference!</p>
        )}
      </div>

      {/* Add/Edit Note Modal */}
      <Modal
        isOpen={showAddNoteModal}
        onClose={() => {
          setShowAddNoteModal(false);
          setEditingNote(null);
          setNoteContent('');
        }}
        title={editingNote ? 'Edit Note' : 'Add New Note'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-1">
              Note Content
            </label>
            <textarea
              id="noteContent"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-32 p-2 border rounded-md"
              placeholder="Enter your note here..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddNoteModal(false);
                setEditingNote(null);
                setNoteContent('');
              }}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={editingNote ? handleUpdateNote : handleAddNote}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!noteContent.trim()}
            >
              {editingNote ? 'Update Note' : 'Add Note'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Link Conference Modal */}
      <Modal
        isOpen={showLinkConferenceModal}
        onClose={() => {
          setShowLinkConferenceModal(false);
          setEditingLink(null);
          setSelectedConference('');
          setPaperTitle('');
          setConferenceNotes('');
        }}
        title={editingLink ? 'Edit Conference Link' : 'Link Conference'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="conference" className="block text-sm font-medium text-gray-700 mb-1">
              Conference
            </label>
            <select
              id="conference"
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a conference</option>
              {conferences.map((conference) => (
                <option key={conference.id} value={conference.id}>
                  {conference.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="paperTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Paper Title (optional)
            </label>
            <input
              id="paperTitle"
              type="text"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter paper title..."
            />
          </div>
          <div>
            <label htmlFor="conferenceNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="conferenceNotes"
              value={conferenceNotes}
              onChange={(e) => setConferenceNotes(e.target.value)}
              className="w-full h-24 p-2 border rounded-md"
              placeholder="Enter any notes about this conference submission..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowLinkConferenceModal(false);
                setEditingLink(null);
                setSelectedConference('');
                setPaperTitle('');
                setConferenceNotes('');
              }}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={editingLink ? handleUpdateLink : handleLinkConference}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!selectedConference}
            >
              {editingLink ? 'Update Link' : 'Link Conference'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
