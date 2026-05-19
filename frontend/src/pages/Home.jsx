/**
 * Home Page
 * Landing page with hero, features, and featured projects
 */

import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiLightningBolt, 
  HiCode, 
  HiSupport, 
  HiShieldCheck,
  HiArrowRight,
  HiChip
} from 'react-icons/hi';
import ProjectCard from '../components/ProjectCard';
import { projectsAPI } from '../api/projects';
import { AuthContext } from '../context/AuthContext';

const HERO_FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#070d1f"/>
          <stop offset="100%" stop-color="#0c1324"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)"/>
      <g stroke="#424754" stroke-width="1" opacity="0.35">
        ${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="600"/>`).join("")}
        ${Array.from({ length: 16 }, (_, i) => `<line x1="0" y1="${i * 40}" x2="800" y2="${i * 40}"/>`).join("")}
      </g>
      <circle cx="400" cy="260" r="90" fill="#151b2d" stroke="#3b82f6" stroke-width="4"/>
      <rect x="340" y="200" width="120" height="120" rx="18" fill="#23293c" stroke="#4ae176" stroke-width="4"/>
      <path d="M370 260h60M400 230v60" stroke="#4ae176" stroke-width="8" stroke-linecap="round"/>
      <text x="400" y="395" fill="#d8e2ff" font-family="Arial, sans-serif" font-size="42" font-weight="700" text-anchor="middle">SYSTEM ONLINE</text>
      <text x="400" y="435" fill="#8c909f" font-family="Arial, sans-serif" font-size="20" text-anchor="middle">IoT / Arduino Project Marketplace</text>
    </svg>
  `);

const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsAPI.getAll({ limit: 3 });
        if (response.success) {
          setFeaturedProjects(response.data.projects);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const features = [
    {
      icon: HiCode,
      title: 'Production-Ready Code',
      description: 'Clean, well-documented code that follows industry best practices.',
    },
    {
      icon: HiChip,
      title: 'Complete Hardware Specs',
      description: 'Detailed component lists and circuit diagrams for easy replication.',
    },
    {
      icon: HiSupport,
      title: 'Technical Support',
      description: 'Get help from our team of experienced developers.',
    },
    {
      icon: HiShieldCheck,
      title: 'Secure Downloads',
      description: 'Instant access to your purchases with secure download links.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-lowest fade-in">
      {/* Hero Section */}
      <section className="relative bg-surface text-white overflow-hidden border-b border-surface-variant/30">
        {/* Hacker Grid Pattern */}
        <div className="absolute inset-0 bg-hacker-grid bg-[size:40px_40px] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-surface-lowest border border-primary-dim/30 rounded-full px-4 py-2 mb-6 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <HiLightningBolt className="w-5 h-5 text-secondary-DEFAULT" />
                <span className="text-sm font-medium text-primary-fixed uppercase tracking-wider">Premium IoT Modules</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight font-display tracking-tight text-white">
                Build Amazing
                <span className="block text-glow">IoT Projects</span>
              </h1>
              
              <p className="text-lg text-primary-fixed mb-8 max-w-lg">
                Get instant access to production-ready IoT and embedded systems projects. 
                Complete source code, documentation, and support included.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/projects" className="btn btn-lg btn-primary">
                  Browse Fleet
                  <HiArrowRight className="w-5 h-5 ml-2" />
                </Link>
                {!user && (
                  <Link to="/signup" className="btn btn-lg btn-secondary font-display uppercase tracking-widest">
                    Initialize
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-outline text-sm">Projects</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">1000+</div>
                  <div className="text-outline text-sm">Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-outline text-sm">Rating</div>
                </div>
              </div>
            </div>

            {/* Hero Image - Holographic HUD overlay */}
            <div className="hidden lg:block">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-DEFAULT to-secondary-DEFAULT rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <img
                  src="/hero-iot.png"
                  alt="IoT Projects Matrix"
                  className="relative rounded-2xl border border-surface-variant/50 min-h-[400px] bg-surface-lowest w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = HERO_FALLBACK_IMAGE;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-lowest relative border-b border-surface-variant/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              System Capabilities
            </h2>
            <p className="text-lg text-outline max-w-2xl mx-auto">
              We provide the core modules to compile your ideas into reality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded glass-panel hover:bg-surface-variant/40 transition-colors group"
              >
                <div className="w-14 h-14 bg-surface-highest border border-primary-dim/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:border-primary-dim/60 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <feature.icon className="w-7 h-7 text-primary-dim" />
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-outline text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-20 bg-surface relative">
        <div className="absolute inset-0 bg-hacker-grid bg-[size:40px_40px] opacity-[0.03]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
                Telemetry & Modules
              </h2>
              <p className="text-lg text-outline">
                Our most requested IoT and embedded hardware configurations.
              </p>
            </div>
            <Link 
              to="/projects"
              className="hidden md:inline-flex items-center gap-2 text-primary-dim font-medium hover:text-primary-fixed transition-colors"
            >
              View All Projects
              <HiArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card">
                  <div className="h-48 skeleton"></div>
                  <div className="p-5">
                    <div className="h-6 skeleton rounded mb-2"></div>
                    <div className="h-4 skeleton rounded w-3/4 mb-4"></div>
                    <div className="h-8 skeleton rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center md:hidden">
            <Link 
              to="/projects"
              className="btn btn-primary btn-lg"
            >
              View All Projects
              <HiArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - ONLY FOR VISITORS */}
      {!user && (
        <section className="py-20 bg-surface-lowest border-t border-secondary-DEFAULT/20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-DEFAULT/10 rounded-full blur-3xl"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              Initialize Connection
            </h2>
            <p className="text-lg text-outline mb-8">
              Join thousands of makers executing their IoT protocols with Inovitaz infrastructure.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn btn-lg btn-primary">
                Create Access Key
              </Link>
              <Link to="/projects" className="btn btn-lg btn-secondary">
                Explore Database
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;