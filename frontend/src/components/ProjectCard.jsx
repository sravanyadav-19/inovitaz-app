// src/components/ProjectCard.jsx
import { Link } from 'react-router-dom';
import { HiShoppingCart, HiEye } from 'react-icons/hi';

const ProjectCard = ({ project }) => {
  const { id, title, description, price, image_url, category, difficulty } = project;

  // Default image if none provided
  const imageUrl = image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400';

  // Difficulty badge color
  const difficultyColor = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
          {category || 'IoT'}
        </span>
        {/* Difficulty Badge */}
        {difficulty && (
          <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full ${difficultyColor[difficulty] || 'bg-gray-100 text-gray-800'}`}>
            {difficulty}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description || 'Complete IoT project with source code and documentation.'}
        </p>

        {/* Price & Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-blue-600">
            ₹{price || 499}
          </div>
          <div className="flex gap-2">
            <Link
              to={`/projects/${id}`}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="View Details"
            >
              <HiEye className="w-5 h-5 text-gray-600" />
            </Link>
            <button
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              title="Add to Cart"
            >
              <HiShoppingCart className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;