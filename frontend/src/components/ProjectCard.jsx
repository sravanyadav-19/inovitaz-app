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
        <HiStar key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-600'}`} />
      ))}
    </div>
  );

  return (
    // FIX: 'relative' here stops the blue hover border from jumping out
    <Link to={`/projects/${id}`} className="group relative block h-full">
      <div className="card hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative z-10 group-hover:border-primary-dim/30 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-surface-lowest border-b border-outline-variant/20">
          <img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            onError={(e) => { e.target.src = 'https://placehold.co/400x300/0c1324/3b82f6?text=No+Image'; }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="inline-block bg-primary-dim/20 text-primary-fixed border border-primary-dim/30 backdrop-blur-md text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                {category || 'IoT'}
              </span>
              {isNew && (
                <span className="inline-block bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-md text-xs font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <HiClock className="w-3 h-3" /> New
                </span>
              )}
            </div>
            <button onClick={toggleWishlist} disabled={wishlistLoading} className="p-2 bg-surface-highest/80 backdrop-blur-md border border-outline-variant/30 text-outline hover:text-white rounded-full shadow-sm transition-all duration-200 hover:scale-110">
              {isWishlisted ? <HiHeart className="w-5 h-5 text-red-400" /> : <HiOutlineHeart className="w-5 h-5 group-hover:text-red-400" />}
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
          <h3 className="text-lg font-display font-semibold text-white mb-2 line-clamp-1 group-hover:text-primary-dim transition-colors">
            {title}
          </h3>

          <p className="text-outline text-sm mb-3 line-clamp-2 flex-1 leading-relaxed">
            {cleanDescription || 'Complete IoT project with source code and documentation.'}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={rating} />
            <span className="text-sm font-medium text-white">{rating ? Number(rating).toFixed(1) : '0.0'}</span>
            <span className="text-xs text-outline">({reviews_count || 0})</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-auto">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold text-primary-dim text-glow">₹{displayPrice}</span>
                <span className="text-sm text-outline opacity-70 line-through">₹{Math.round(displayPrice * 1.5)}</span>
              </div>
              <span className="text-xs text-secondary font-medium">33% OFF</span>
            </div>

            <div className="flex gap-2">
              <div className="p-2.5 bg-surface-highest border border-outline-variant/30 rounded-lg hover:bg-surface-variant hover:border-outline-variant transition-colors">
                <HiEye className="w-5 h-5 text-outline group-hover:text-white" />
              </div>
              {!isPurchased && (
                <div className="p-2.5 bg-gradient-to-r from-primary-dim to-primary-container shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-lg transition-all">
                  <HiShoppingCart className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hover Border Effect (Fixed z-index) */}
        <div className="absolute inset-0 border border-primary-dim/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20" />
      </div>
    </Link>
  );
};

export default ProjectCard;