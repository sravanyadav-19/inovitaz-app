import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  HiShoppingCart,
  HiCheck,
  HiEye,
  HiStar,
  HiHeart,
  HiOutlineHeart,
  HiClock,
} from 'react-icons/hi';
import { projectsAPI } from '../api/projects';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { requestCookieConsent } from '../context/CookieConsentContext';
import toast from 'react-hot-toast';
import { formatINRFromPaise } from '../utils/price';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#0c1324"/>
      <rect x="16" y="16" width="368" height="268" rx="18" fill="#151b2d" stroke="#3b82f6" stroke-width="2"/>
      <circle cx="200" cy="120" r="38" fill="#23293c" stroke="#4ae176" stroke-width="2"/>
      <path d="M185 120h30M200 105v30" stroke="#4ae176" stroke-width="5" stroke-linecap="round"/>
      <text x="200" y="190" fill="#d8e2ff" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle">IoT Project</text>
      <text x="200" y="220" fill="#8c909f" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">No Image Available</text>
    </svg>
  `);

function HighlightText({ text, query }) {
  const q = (query || '').trim();
  if (!q || !text) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={index} className="bg-yellow-400/25 text-white rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

const StarRating = ({ rating }) => (
  <div aria-hidden="true" className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <HiStar
        key={star}
        className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-600'}`}
      />
    ))}
  </div>
);

const ProjectCard = ({ project, highlight = '' }) => {
  const { isAuthenticated } = useAuth();
  const { add, has } = useCart();
  const {
    id,
    title,
    description,
    price,
    thumbnail,
    image_url: imageUrl,
    category,
    difficulty,
    isPurchased,
    created_at: createdAt,
  } = project;

  const inCart = has(id);
  const [isWishlisted, setIsWishlisted] = useState(
    Boolean(project.isWishlisted ?? project.is_wishlisted ?? false)
  );
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = () => {
    if (inCart) {
      toast('Already in your cart');
      return;
    }
    add(project);
    requestCookieConsent();
    toast.success('Added to cart');
  };

  const averageRating = Number(project.average_rating ?? project.rating ?? 0);
  const reviewCount = Number(project.reviews_count ?? project.review_count ?? 0);
  const displayImage = thumbnail || imageUrl || FALLBACK_IMAGE;

  let cleanDescription = description;
  try {
    if (description && typeof description === 'string' && description.trim().startsWith('{')) {
      const parsed = JSON.parse(description);
      cleanDescription = parsed.overview || description;
    }
  } catch {
    const match = description?.match(/"overview"\s*:\s*"(.*?)(?<!\\)"/);
    if (match?.[1]) cleanDescription = match[1];
  }

  const diffStyle = {
    Beginner: 'bg-green-500/15 text-green-400 border border-green-500/25',
    Intermediate: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
    Advanced: 'bg-red-500/15 text-red-400 border border-red-500/25',
  }[difficulty] || 'bg-surface-highest text-outline border border-outline-variant/30';

  const isNew = createdAt && new Date().getTime() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const response = isWishlisted
        ? await projectsAPI.removeFromWishlist(id)
        : await projectsAPI.addToWishlist(id);

      if (response.success) {
        setIsWishlisted((previous) => !previous);
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
      } else {
        toast.error(response.message || 'Failed to update wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const detailsPath = `/projects/${id}`;

  return (
    <article className="group relative h-full">
      <div className="card h-full flex flex-col relative z-10 transition-colors duration-200 group-hover:border-primary-dim/40">
        <div className="relative h-48 overflow-hidden bg-surface-lowest border-b border-surface-variant">
          <Link to={detailsPath} aria-label={`View ${title}`} className="block h-full">
            <img
              src={displayImage}
              alt={title}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="inline-block bg-primary-dim/20 text-primary-fixed border border-primary-dim/30 backdrop-blur-md text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                {category || 'IoT'}
              </span>
              {isNew && (
                <span className="inline-flex bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-md text-xs font-medium px-3 py-1 rounded-full shadow-sm items-center gap-1">
                  <HiClock aria-hidden="true" className="w-3 h-3" /> New
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              aria-label={isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
              aria-pressed={isWishlisted}
              className="w-11 h-11 inline-flex items-center justify-center bg-surface-highest/80 backdrop-blur-md border border-outline-variant/30 text-outline hover:text-white hover:bg-surface-highest rounded-full transition-colors duration-200 disabled:opacity-60"
            >
              {isWishlisted ? <HiHeart aria-hidden="true" className="w-5 h-5 text-red-400" /> : <HiOutlineHeart aria-hidden="true" className="w-5 h-5 group-hover:text-red-400" />}
            </button>
          </div>

          {difficulty && (
            <span className={`absolute bottom-3 right-3 ${diffStyle} text-xs font-medium px-3 py-1 rounded-full shadow-sm`}>
              {difficulty}
            </span>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-display font-semibold text-white mb-2 line-clamp-1 group-hover:text-primary-dim transition-colors">
            <Link to={detailsPath} className="focus-visible:rounded-sm">
              <HighlightText text={title} query={highlight} />
            </Link>
          </h3>

          <p className="text-outline text-sm mb-3 line-clamp-2 flex-1 leading-relaxed">
            <HighlightText text={cleanDescription || 'Complete IoT project with source code and documentation.'} query={highlight} />
          </p>

          <div className="flex items-center gap-2 mb-4" aria-label={`${averageRating ? averageRating.toFixed(1) : '0.0'} out of 5 stars from ${reviewCount} reviews`}>
            <StarRating rating={averageRating} />
            <span className="text-sm font-medium text-white">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
            <span className="text-xs text-outline">({reviewCount})</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-variant mt-auto">
            <div className="flex flex-col">
              <span className="t-num text-2xl font-bold text-primary-dim">{formatINRFromPaise(price)}</span>
              <span className="text-xs text-outline font-medium">One-time purchase</span>
            </div>

            <div className="flex gap-2">
              <Link
                to={detailsPath}
                aria-label={`View details for ${title}`}
                className="w-11 h-11 inline-flex items-center justify-center bg-surface-highest border border-outline-variant/30 rounded-full hover:bg-surface-bright transition-colors"
              >
                <HiEye aria-hidden="true" className="w-5 h-5 text-outline group-hover:text-white" />
              </Link>

              {!isPurchased && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  aria-label={inCart ? `${title} is already in cart` : `Add ${title} to cart`}
                  className={`w-11 h-11 inline-flex items-center justify-center rounded-full transition-colors duration-200 ${
                    inCart
                      ? 'bg-success/15 text-success-fg border border-success/40'
                      : 'bg-primary hover:bg-primary-container'
                  }`}
                >
                  {inCart ? <HiCheck aria-hidden="true" className="w-5 h-5" /> : <HiShoppingCart aria-hidden="true" className="w-5 h-5 text-white" />}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </article>
  );
};

export default ProjectCard;
