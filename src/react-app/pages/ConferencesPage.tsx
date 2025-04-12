import { useState, useEffect } from 'react';
import { Conference } from '../types';
import { useConferences } from '../hooks/useConferences';
import { ConferenceCard } from '../components/ConferenceCard';
import { ConferenceForm } from '../components/ConferenceForm';
import { Modal } from '../components/Modal';

export function ConferencesPage() {
  const {
    conferences,
    loading,
    error,
    fetchConferences,
    fetchConference,
    createConference,
    updateConference,
    deleteConference
  } = useConferences();

  const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch selected conference when ID changes
  useEffect(() => {
    const getConference = async () => {
      if (selectedConferenceId) {
        const conference = await fetchConference(selectedConferenceId);
        if (conference) {
          setSelectedConference(conference);
          setShowEditModal(true);
        }
      }
    };

    getConference();
  }, [selectedConferenceId, fetchConference]);

  // Handle edit conference
  const handleEdit = (id: string) => {
    setSelectedConferenceId(id);
  };

  // Handle delete conference
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this conference?')) {
      const success = await deleteConference(id);
      if (success) {
        alert('Conference deleted successfully');
      }
    }
  };

  // Handle add new conference
  const handleAddNew = () => {
    setShowAddModal(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchConferences();
  };

  // Handle form submission for creating a new conference
  const handleCreateSubmit = async (data: Partial<Conference>) => {
    setIsSubmitting(true);
    try {
      const newConference = await createConference(data as Omit<Conference, 'id'>);
      if (newConference) {
        setShowAddModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission for updating a conference
  const handleUpdateSubmit = async (data: Partial<Conference>) => {
    if (!selectedConferenceId) return;

    setIsSubmitting(true);
    try {
      const updatedConference = await updateConference(selectedConferenceId, data);
      if (updatedConference) {
        setShowEditModal(false);
        setSelectedConferenceId(null);
        setSelectedConference(null);
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
    setSelectedConferenceId(null);
    setSelectedConference(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Conferences</h1>
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
            Add Conference
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

      {loading && conferences.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : conferences.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-zinc-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No conferences found</h3>
          <p className="text-zinc-500 mb-4">Get started by adding your first conference.</p>
          <button
            onClick={handleAddNew}
            className="btn btn-primary"
          >
            Add Conference
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conferences.map((conference: Conference) => (
            <ConferenceCard
              key={conference.id}
              conference={conference}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Conference Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Add New Conference"
      >
        <ConferenceForm
          onSubmit={handleCreateSubmit}
          onCancel={handleCloseAddModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Conference Modal */}
      <Modal
        isOpen={showEditModal && selectedConference !== null}
        onClose={handleCloseEditModal}
        title="Edit Conference"
      >
        {selectedConference && (
          <ConferenceForm
            initialData={selectedConference}
            onSubmit={handleUpdateSubmit}
            onCancel={handleCloseEditModal}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
