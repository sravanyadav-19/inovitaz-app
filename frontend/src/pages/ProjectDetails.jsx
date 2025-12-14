import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { projectsAPI } from "../api/projects";
import { AuthContext } from "../context/AuthContext";
import Linkify from 'react-linkify'; 
import { 
  HiStar, 
  HiShoppingCart, 
  HiChip, 
  HiHeart,
  HiOutlineHeart,
  HiCheckCircle,
  HiLockClosed,
  HiClock,
  HiDownload,
  HiPhotograph,
  HiClipboardList,
  HiLink,
  HiUserCircle,
  HiExternalLink
} from "react-icons/hi";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProjectDetails() {
  const { id } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Review Form State
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadProject();
    loadReviews();
    checkWishlist();
  }, [id]);

  async function loadProject() {
    try {
      const res = await projectsAPI.getById(id);
      if (res?.success) setProject(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${id}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!newReview.comment.trim()) return toast.error("Please write a comment");
    
    setSubmittingReview(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          project_id: id,
          rating: newReview.rating, 
          comment: newReview.comment 
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted!");
        setNewReview({ rating: 5, comment: "" });
        loadReviews();
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSubmittingReview(false);
    }
  }

  function checkWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlisted(wishlist.includes(id));
  }

  async function toggleWishlist() {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      if (isWishlisted) {
        await projectsAPI.removeFromWishlist(id);
        toast.success('Removed from wishlist');
        setIsWishlisted(false);
      } else {
        await projectsAPI.addToWishlist(id);
        toast.success('Added to wishlist');
        setIsWishlisted(true);
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  }

  // --- SMART DATA PARSER (FIXED FOR QUANTITY) ---
  let overviewText = "";
  let components = []; // Stores { name, quantity, link }
  let downloadUrl = "#";
  let circuit = { image: "", text: "" };
  let steps = "";
  let source = "";

  if (project) {
    const rawDesc = project.description || "";
    try {
      let descObj = {};
      if (typeof rawDesc === 'object') {
        descObj = rawDesc;
      } else if (rawDesc.trim().startsWith('{')) {
        descObj = JSON.parse(rawDesc);
      } else {
        descObj = { overview: rawDesc };
      }

      overviewText = descObj.overview || rawDesc;
      downloadUrl = descObj.download_url || "#";
      circuit = descObj.circuit || { image: descObj.circuitImage, text: descObj.circuitText } || {};
      steps = descObj.steps || "";
      source = descObj.source || "";

      // FIX: Correctly parse objects to keep quantity
      if (descObj.components) {
        if (Array.isArray(descObj.components)) {
          components = descObj.components.map(c => {
             // If it's an object from Admin Panel
             if (typeof c === 'object') {
                return {
                  name: c.name || "Unknown Component",
                  quantity: c.quantity || c.price || "1", // Handle 'price' legacy field or 'quantity'
                  link: c.link || ""
                };
             }
             // If it's just a string string (legacy data)
             return { name: c, quantity: "1", link: "" };
          });
        } else if (typeof descObj.components === 'string') {
          // If newline separated string
          components = descObj.components.split(/,|\n/).map(line => ({
            name: line.trim(),
            quantity: "1",
            link: ""
          })).filter(c => c.name);
        }
      }
    } catch (e) {
      overviewText = rawDesc.replace(/[{"}]/g, '').replace(/overview:/g, '');
    }
  }

  const displayPrice = project ? (project.price > 10000 ? project.price / 100 : project.price) : 0;
  
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const purchased = project?.isPurchased || user?.role === "admin";

  async function handleBuy() {
    if (!user) {
      toast.error("Please log in to buy.");
      navigate('/login');
      return;
    }

    if (!window.Razorpay) {
      toast.error("Payment system loading... please refresh.");
      return;
    }

    setProcessing(true);

    try {
      const orderRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ projectId: project.id }),
        }
      );

      if (orderRes.status === 401) {
        toast.error("Session expired. Please login again.");
        logout(); 
        navigate('/login');
        return;
      }

      const orderData = await orderRes.json();
      if (!orderData.success) { throw new Error(orderData.message); }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Inovitaz",
        description: project.title,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/payment/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                  projectId: project.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Payment Successful! Project Unlocked.");
              window.location.reload();
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (e) {
            toast.error("Verification error.");
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Payment initialization failed.");
      setProcessing(false);
    }
  }

  // --- LINK DECORATORS ---
  const standardLinkDecorator = (href, text, key) => (
    <a href={href} key={key} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-words z-20 relative">
      {text}
    </a>
  );

  const StarRating = ({ rating }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <HiStar key={star} className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center z-10 rounded-lg border border-secondary-200">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-secondary-100 max-w-sm transform scale-100 transition-transform">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HiLockClosed className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-secondary-900 mb-2">Premium Content Locked</h3>
        <p className="text-secondary-500 mb-6 leading-relaxed">
          Purchase this project to instantly access the full source code, circuit diagrams, and documentation.
        </p>
        <button 
          onClick={handleBuy} 
          disabled={processing}
          className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          {processing ? "Processing..." : <><HiShoppingCart /> Buy Now ₹{displayPrice}</>}
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>;
  if (!project) return <div className="text-center py-20">Project not found.</div>;

  const tabs = ['overview', 'components'];
  if (purchased) {
    tabs.push('circuit', 'steps');
  }
  tabs.push('reviews');

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Image */}
            <div className="relative">
              <img 
                src={project.thumbnail || 'https://via.placeholder.com/600x400'} 
                alt={project.title} 
                className="w-full rounded-xl shadow-lg object-cover aspect-video"
                onError={(e) => e.target.src = 'https://via.placeholder.com/600x400'}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <span className="text-primary-600 font-semibold tracking-wide text-sm mb-2 uppercase">{project.category}</span>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2 leading-tight">{project.title}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <StarRating rating={avgRating} />
                  <span className="text-lg font-bold ml-1">{avgRating > 0 ? avgRating : "New"}</span>
                  <span className="text-sm text-secondary-500">({reviews.length} reviews)</span>
                </div>
                <button onClick={toggleWishlist} className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full hover:bg-red-50 transition-colors text-secondary-600 hover:text-red-500">
                  {isWishlisted ? <HiHeart className="w-6 h-6 text-red-500" /> : <HiOutlineHeart className="w-6 h-6" />}
                  <span className="text-sm font-medium">{isWishlisted ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-5xl font-bold text-primary-600">₹{displayPrice}</span>
                <span className="text-xl text-secondary-400 line-through">₹{Math.round(displayPrice * 1.5)}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">33% OFF</span>
              </div>

              {!purchased ? (
                <button onClick={handleBuy} disabled={processing} className="w-full btn btn-primary btn-lg text-lg py-4 shadow-lg hover:shadow-xl transition-all">
                  {processing ? "Processing Payment..." : "Buy Now & Unlock Full Access"}
                </button>
              ) : (
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full btn btn-success btn-lg text-lg py-4 text-center block shadow-lg bg-green-600 hover:bg-green-700 text-white rounded-lg">
                  Download Project Files (ZIP)
                </a>
              )}
              
              {!purchased && (
                <p className="text-center text-xs text-secondary-400 mt-3 flex items-center justify-center gap-1">
                  <HiCheckCircle className="text-green-500" /> Secure payment via Razorpay
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="card overflow-hidden bg-white shadow-sm rounded-xl min-h-[400px]">
          {/* Tab Navigation */}
          <div className="flex border-b bg-gray-50 overflow-x-auto">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-6 py-4 capitalize font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-primary-600 text-primary-700 bg-white' : 'border-transparent text-secondary-500 hover:text-secondary-800 hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8 relative">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="relative">
                <div className={`prose max-w-none text-secondary-700 leading-relaxed ${!purchased ? 'max-h-40 overflow-hidden mask-fade-bottom' : ''}`}>
                  <h3 className="text-xl font-bold text-secondary-900 mb-4">Project Overview</h3>
                  <div style={{ whiteSpace: "pre-line" }}>
                    <Linkify componentDecorator={standardLinkDecorator}>
                      {overviewText}
                    </Linkify>
                  </div>
                </div>
                {!purchased && <LockedOverlay />}
              </div>
            )}

            {/* COMPONENTS TAB - FIXED TO SHOW QUANTITY */}
            {activeTab === 'components' && (
              <div className="relative min-h-[200px]">
                {purchased ? (
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-6">Required Components</h3>
                    {components.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {components.map((c, i) => (
                          <div key={i} className="flex items-center justify-between bg-secondary-50 p-4 rounded-xl border border-secondary-100 hover:shadow-md transition-all">
                            {/* Left: Name and Quantity */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <HiChip className="text-primary-600 w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-secondary-900">{c.name}</p>
                                <p className="text-xs text-secondary-500 font-medium bg-secondary-200 px-2 py-0.5 rounded-full inline-block mt-1">
                                  Qty: {c.quantity}
                                </p>
                              </div>
                            </div>

                            {/* Right: Buy Link */}
                            {c.link && (
                              <a 
                                href={c.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <HiShoppingCart className="w-3 h-3" />
                                Buy
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary-500 italic">No component list available.</p>
                    )}
                  </div>
                ) : (
                  // Blurred Dummy Content
                  <div className="filter blur-md select-none opacity-50">
                    <h3 className="text-xl font-bold text-secondary-900 mb-4">Required Components</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[1,2,3,4].map((i) => (
                          <li key={i} className="flex items-center gap-3 bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                            <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                {!purchased && <LockedOverlay />}
              </div>
            )}

            {/* CIRCUIT TAB */}
            {activeTab === 'circuit' && (
              <div>
                <h3 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <HiPhotograph className="text-primary-500" /> Circuit Diagram
                </h3>
                {circuit.image ? (
                  <div className="mb-6">
                    <img src={circuit.image} alt="Circuit" className="rounded-lg border border-secondary-200 shadow-sm max-w-full md:max-w-2xl" />
                  </div>
                ) : (
                  <p className="text-secondary-500 italic mb-4">No diagram image available.</p>
                )}
                
                {circuit.text && (
                  <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-100">
                    <h4 className="font-semibold text-secondary-900 mb-2">Wiring Instructions:</h4>
                    <div className="text-secondary-700 whitespace-pre-line">
                      <Linkify componentDecorator={standardLinkDecorator}>
                        {circuit.text}
                      </Linkify>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEPS TAB */}
            {activeTab === 'steps' && (
              <div>
                <h3 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <HiClipboardList className="text-primary-500" /> Step-by-Step Guide
                </h3>
                <div className="prose max-w-none text-secondary-700">
                  <div style={{ whiteSpace: "pre-line" }}>
                    <Linkify componentDecorator={standardLinkDecorator}>
                      {steps || "No steps provided."}
                    </Linkify>
                  </div>
                </div>

                {source && (
                  <div className="mt-8 border-t border-secondary-200 pt-6">
                    <h4 className="text-lg font-bold text-secondary-900 mb-3">Source Code / Notes</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      {source}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-bold text-secondary-900 mb-6">Customer Reviews</h3>

                {purchased ? (
                  <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100">
                    <h4 className="font-bold text-secondary-800 mb-3">Leave a Review</h4>
                    <form onSubmit={handleSubmitReview}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium text-secondary-600">Rating:</span>
                        <div className="flex gap-1 cursor-pointer">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <HiStar 
                              key={star} 
                              onClick={() => setNewReview({...newReview, rating: star})}
                              className={`w-7 h-7 hover:scale-110 transition-transform ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <textarea
                        className="w-full p-3 border border-secondary-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none mb-3"
                        rows="3"
                        placeholder="Share your experience..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      />
                      <button 
                        disabled={submittingReview} 
                        className="btn btn-primary px-6 py-2 shadow-sm"
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                ) : user ? (
                  <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center border border-dashed border-gray-300">
                    <p className="text-secondary-500">You must purchase this project to leave a review.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center border border-dashed border-gray-300">
                    <p className="text-secondary-500">Please <Link to="/login" className="text-primary-600 underline">login</Link> and purchase to leave a review.</p>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review, idx) => (
                      <div key={review.id || idx} className="border-b border-secondary-100 pb-6 last:border-0">
                        <div className="flex items-start gap-4">
                           <div className="bg-gray-200 rounded-full p-2">
                             <HiUserCircle className="w-8 h-8 text-gray-500"/>
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-bold text-secondary-900">{review.user_name || "Verified Buyer"}</h5>
                                <span className="text-xs text-secondary-400">
                                  {review.created_at ? new Date(review.created_at).toLocaleDateString() : "Recent"}
                                </span>
                              </div>
                              <StarRating rating={review.rating} />
                              <p className="text-secondary-700 mt-2 leading-relaxed">{review.comment}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-500 italic text-center py-4">No reviews yet. Be the first to review!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}