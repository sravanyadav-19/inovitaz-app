// src/pages/ProjectDetails.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HiDownload, HiTag, HiClock, HiChip } from 'react-icons/hi';
import { projectsAPI } from '../api/projects';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../hooks/useAuth';

const ProjectDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await projectsAPI.getById(id);
        if (res.success) {
          setProject(res.data.project || res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading project..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary-600">Project not found.</p>
      </div>
    );
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: content */}
          <div className="lg:col-span-2">
            <img
              src={
                project.thumbnail ||
                project.image_url ||
                'https://via.placeholder.com/800x400'
              }
              alt={project.title}
              className="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-md mb-6"
            />
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">
              {project.title}
            </h1>
            <p className="text-secondary-600 mb-4">{project.description}</p>

            {Array.isArray(project.features) && project.features.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                  Key Features
                </h2>
                <ul className="list-disc list-inside text-secondary-600 space-y-1">
                  {project.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                  Tech Stack
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700"
                    >
                      <HiChip className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: purchase card */}
          <div>
            <div className="card p-6 sticky top-24">
              <p className="text-sm text-secondary-500 mb-1">Project Price</p>
              <p className="text-3xl font-bold text-secondary-900 mb-4">
                {formatPrice(project.price)}
              </p>

              <div className="space-y-2 text-sm text-secondary-600 mb-6">
                {project.category && (
                  <p className="flex items-center gap-2">
                    <HiTag className="w-4 h-4" />
                    <span>{project.category}</span>
                  </p>
                )}
                {project.estimated_time && (
                  <p className="flex items-center gap-2">
                    <HiClock className="w-4 h-4" />
                    <span>Build time: {project.estimated_time}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setPaymentOpen(true)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <HiDownload className="w-5 h-5" />
                {isAuthenticated ? 'Buy & Download' : 'Login to Purchase'}
              </button>

              <p className="mt-3 text-xs text-secondary-500">
                Includes source code, documentation and support.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        project={project}
        isOpen={paymentOpen && isAuthenticated}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => setPaymentOpen(false)}
      />
    </div>
  );
};

export default ProjectDetails;