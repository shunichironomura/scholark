import { ResearchTopic } from '../../shared/schemas';
import { Link } from 'react-router-dom';

interface ResearchTopicCardProps {
  topic: ResearchTopic;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ResearchTopicCard({ topic, onEdit, onDelete }: ResearchTopicCardProps) {
  const { id, name, description } = topic;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={`/research-topics/${id}`} className="block p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">{name}</h3>
          {(onEdit || onDelete) && (
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(id);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Edit research topic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(id);
                  }}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Delete research topic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {description && (
          <div className="mt-2">
            <p className="text-zinc-700">{description}</p>
          </div>
        )}

        <div className="mt-4 flex items-center text-zinc-500 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          <span>Research Topic</span>
        </div>
      </Link>
    </div>
  );
}
