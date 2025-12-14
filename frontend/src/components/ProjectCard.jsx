import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  HiShoppingCart, 
  HiEye, 
  HiStar,
  HiHeart,
  HiOutlineHeart,
  HiCheckCircle,
  HiClock
} from 'react-icons/hi';
import { projectsAPI } from '../api/projects';
import toast from 'react-hot-toast';

const ProjectCard = ({ project }) => {
  const { 
    id, 
    title, 
    description, 
    price, 
    thumbnail, 
    image_url, 
    category, 
    difficulty,
    rating,
    reviews_count,
    isPurchased,
    created_at
  } = project;

  const [isWishlisted, setIsWishlisted] = useState(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wishlist.includes(id);
  });

  const [wishlistLoading, setWishlistLoading] = useState(false);

  // --- IMAGE LOGIC ---
  const displayImage = thumbnail || image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400';

  // --- SMART DESCRIPTION PARSER ---
  let cleanDescription = description;
  try {
    // If it looks like JSON, try to parse it
    if (description && description.trim().startsWith('{')) {
      const parsed = JSON.parse(description);
      cleanDescription = parsed.overview || description;
    }
  } catch (e) {
    // If JSON parse fails (bad format), try Regex to grab overview
    const match = description.match(/"overview"\s*:\s*"(.*?)(?<!\\)"/);
    if (match && match[1]) {
      cleanDescription = match[1];
    }
    // If all fails, just show original text
  }

  // --- PRICE FIX (Paise to Rupee) ---
  const displayPrice = price > 10000 ? price / 100 : price;

  const diffStyle = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  }[difficulty] || 'bg-gray-100 text-gray-800';

  const isNew = created_at && (new Date() - new Date(created_at)) < 7 * 24 * 60 * 60 * 1000;

  const toggleWishlist = async (e) => {
    e.preventDefault(); // Prevent clicking the card link
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await projectsAPI.removeFromWishlist(id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await projectsAPI.addToWishlist(id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const StarRating = ({ rating }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <HiStar key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  return (
    // FIX: 'relative' here stops the blue hover border from jumping out
    <Link to={`/projects/${id}`} className="group relative block h-full">
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all duration-300 h-full flex flex-col relative z-10">
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-secondary-100">
          <img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="inline-block bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                {category || 'IoT'}
              </span>
              {isNew && (
                <span className="inline-block bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <HiClock className="w-3 h-3" /> New
                </span>
              )}
            </div>
            <button onClick={toggleWishlist} disabled={wishlistLoading} className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm transition-all duration-200 hover:scale-110">
              {isWishlisted ? <HiHeart className="w-5 h-5 text-red-500" /> : <HiOutlineHeart className="w-5 h-5 text-secondary-600 group-hover:text-red-500" />}
            </button>
          </div>

          {difficulty && (
            <span className={`absolute bottom-3 right-3 ${diffStyle} text-xs font-medium px-3 py-1 rounded-full shadow-sm`}>
              {difficulty}
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          <p className="text-secondary-600 text-sm mb-3 line-clamp-2 flex-1 leading-relaxed">
            {cleanDescription || 'Complete IoT project with source code and documentation.'}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={rating} />
            <span className="text-sm font-medium text-secondary-900">{rating ? Number(rating).toFixed(1) : '0.0'}</span>
            <span className="text-xs text-secondary-500">({reviews_count || 0})</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-secondary-100 mt-auto">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary-600">₹{displayPrice}</span>
                <span className="text-sm text-secondary-500 line-through">₹{Math.round(displayPrice * 1.5)}</span>
              </div>
              <span className="text-xs text-green-600 font-medium">33% OFF</span>
            </div>

            <div className="flex gap-2">
              <div className="p-2.5 bg-secondary-100 rounded-lg hover:bg-secondary-200 transition-colors">
                <HiEye className="w-5 h-5 text-secondary-600" />
              </div>
              {!isPurchased && (
                <div className="p-2.5 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                  <HiShoppingCart className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hover Border Effect (Fixed z-index) */}
        <div className="absolute inset-0 border-2 border-primary-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
      </div>
    </Link>
  );
};

export default ProjectCard;