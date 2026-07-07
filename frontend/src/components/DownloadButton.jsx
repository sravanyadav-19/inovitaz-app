import { useState } from 'react';
import { HiDownload, HiExclamationCircle } from 'react-icons/hi';
import api from '../api/axios';

const DownloadButton = ({ projectId, isPurchased }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!isPurchased) {
      setError('You must purchase this project to download');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/projects/${projectId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        const { downloadUrl } = response.data.data;
        
        // Redirect the browser to the proxy endpoint.
        // Because the endpoint returns 'attachment' headers, 
        // the browser will trigger a download instead of navigating away.
        window.location.href = `${import.meta.env.VITE_API_URL}${downloadUrl}`;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Download failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading || !isPurchased}
        className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          'Preparing Download...'
        ) : (
          <>
            <HiDownload className="w-5 h-5" />
            Download Project
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
          <HiExclamationCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default DownloadButton;