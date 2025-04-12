import { useState, FormEvent } from 'react';
import { Conference } from '../types';

interface ConferenceFormProps {
  initialData?: Partial<Conference>;
  onSubmit: (data: Partial<Conference>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ConferenceForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ConferenceFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    start_date: initialData.start_date || '',
    paper_deadline: initialData.paper_deadline || '',
    location: initialData.metadata?.location || '',
    website: initialData.metadata?.website || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Prepare the data for submission
    const submissionData: Partial<Conference> = {
      name: formData.name,
      start_date: formData.start_date || null,
      paper_deadline: formData.paper_deadline || null,
      metadata: {
        location: formData.location,
        website: formData.website,
      },
    };

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Conference Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., NeurIPS 2025"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Conference Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="paper_deadline" className="block text-sm font-medium text-gray-700">
            Paper Submission Deadline
          </label>
          <input
            type="date"
            id="paper_deadline"
            name="paper_deadline"
            value={formData.paper_deadline}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Vancouver, Canada"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website URL
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., https://neurips.cc"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !formData.name}
        >
          {isSubmitting ? 'Saving...' : initialData.id ? 'Update Conference' : 'Add Conference'}
        </button>
      </div>
    </form>
  );
}
