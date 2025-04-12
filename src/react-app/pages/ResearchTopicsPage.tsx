import { useState, useEffect } from 'react';
import { ResearchTopic } from '../types';
import { useResearchTopics } from '../hooks/useResearchTopics';
import { ResearchTopicCard } from '../components/ResearchTopicCard';
import { ResearchTopicForm } from '../components/ResearchTopicForm';
import { Modal } from '../components/Modal';

export function ResearchTopicsPage() {
  const {
    topics,
    loading,
    error,
    fetchTopics,
    fetchTopic,
    createTopic,
    updateTopic,
    deleteTopic
  } = useResearchTopics();

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ResearchTopic | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch selected topic when ID changes
  useEffect(() => {
    const getTopic = async () => {
      if (selectedTopicId) {
        const topic = await fetchTopic(selectedTopicId);
        if (topic) {
          setSelectedTopic(topic);
          setShowEditModal(true);
        }
      }
    };

    getTopic();
  }, [selectedTopicId, fetchTopic]);

  // Handle edit topic
  const handleEdit = (id: string) => {
    setSelectedTopicId(id);
  };

  // Handle delete topic
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this research topic?')) {
      const success = await deleteTopic(id);
      if (success) {
        alert('Research topic deleted successfully');
      }
    }
  };

  // Handle add new topic
  const handleAddNew = () => {
    setShowAddModal(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchTopics();
  };

  // Handle form submission for creating a new topic
  const handleCreateSubmit = async (data: Partial<ResearchTopic>) => {
    setIsSubmitting(true);
    try {
      const newTopic = await createTopic(data as Omit<ResearchTopic, 'id'>);
      if (newTopic) {
        setShowAddModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission for updating a topic
  const handleUpdateSubmit = async (data: Partial<ResearchTopic>) => {
    if (!selectedTopicId) return;

    setIsSubmitting(true);
    try {
      const updatedTopic = await updateTopic(selectedTopicId, data);
      if (updatedTopic) {
        setShowEditModal(false);
        setSelectedTopicId(null);
        setSelectedTopic(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modals
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTopicId(null);
    setSelectedTopic(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Research Topics</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-secondary flex items-center"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleAddNew}
            className="btn btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Research Topic
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && topics.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : topics.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-zinc-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No research topics found</h3>
          <p className="text-zinc-500 mb-4">Get started by adding your first research topic.</p>
          <button
            onClick={handleAddNew}
            className="btn btn-primary"
          >
            Add Research Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic: ResearchTopic) => (
            <ResearchTopicCard
              key={topic.id}
              topic={topic}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Research Topic Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Add New Research Topic"
      >
        <ResearchTopicForm
          onSubmit={handleCreateSubmit}
          onCancel={handleCloseAddModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Research Topic Modal */}
      <Modal
        isOpen={showEditModal && selectedTopic !== null}
        onClose={handleCloseEditModal}
        title="Edit Research Topic"
      >
        {selectedTopic && (
          <ResearchTopicForm
            initialData={selectedTopic}
            onSubmit={handleUpdateSubmit}
            onCancel={handleCloseEditModal}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
