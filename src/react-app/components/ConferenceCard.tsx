import { Conference } from '../types';

interface ConferenceCardProps {
  conference: Conference;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ConferenceCard({ conference, onEdit, onDelete }: ConferenceCardProps) {
  const { id, name, start_date, paper_deadline, metadata } = conference;

  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate days remaining until deadline
  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;

    const deadline = new Date(dateString);
    const today = new Date();

    // Reset time part for accurate day calculation
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const daysUntilDeadline = paper_deadline ? getDaysRemaining(paper_deadline) : null;

  // Determine deadline status for styling
  const getDeadlineStatus = () => {
    if (!daysUntilDeadline) return '';

    if (daysUntilDeadline < 0) {
      return 'text-zinc-500'; // Past deadline
    } else if (daysUntilDeadline <= 7) {
      return 'text-red-500 font-bold'; // Urgent (within a week)
    } else if (daysUntilDeadline <= 30) {
      return 'text-orange-500'; // Approaching (within a month)
    } else {
      return 'text-green-500'; // Plenty of time
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">{name}</h3>
          {(onEdit || onDelete) && (
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Edit conference"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Delete conference"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center text-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Conference Date:</strong> {formatDate(start_date)}
            </span>
          </div>

          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className={getDeadlineStatus()}>
              <strong>Paper Deadline:</strong> {formatDate(paper_deadline)}
              {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
                <span className="ml-2">
                  ({daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'} remaining)
                </span>
              )}
              {daysUntilDeadline !== null && daysUntilDeadline < 0 && (
                <span className="ml-2">(Deadline passed)</span>
              )}
            </span>
          </div>

          {metadata && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              {metadata.location && (
                <div className="flex items-center text-zinc-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{metadata.location}</span>
                </div>
              )}

              {metadata.website && (
                <div className="flex items-center text-zinc-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <a
                    href={metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Conference Website
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
