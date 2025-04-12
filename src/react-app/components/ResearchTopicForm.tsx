import { useState, FormEvent } from 'react';
import { ResearchTopic } from '../../shared/schemas';

interface ResearchTopicFormProps {
  initialData?: ResearchTopic;
  onSubmit: (data: Partial<ResearchTopic>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ResearchTopicForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ResearchTopicFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Topic Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Machine Learning, NLP, Computer Vision, etc."
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Describe your research topic..."
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Topic' : 'Create Topic'}
        </button>
      </div>
    </form>
  );
}
