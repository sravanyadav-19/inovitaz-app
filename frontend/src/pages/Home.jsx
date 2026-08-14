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
  HiChip,
  HiDownload,
  HiDocumentText,
  HiCheckCircle
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

  const featureGroups = [
    {
      id: 'build',
      label: 'Build',
      tagline: 'From idea to working prototype',
      features: [
        {
          icon: HiCode,
          title: 'Production-ready source code',
          description: 'Download complete, commented code for every project.',
          benefit: 'Ship working firmware without starting from scratch.',
        },
        {
          icon: HiChip,
          title: 'Hardware specs & schematics',
          description: 'Exact component lists and circuit diagrams included.',
          benefit: 'Order the right parts the first time.',
        },
      ],
    },
    {
      id: 'buy',
      label: 'Buy with confidence',
      tagline: 'Instant, secure, and yours to keep',
      features: [
        {
          icon: HiDownload,
          title: 'Instant secure delivery',
          description: 'Files unlock the moment your payment is confirmed.',
          benefit: 'Start building in minutes, not days.',
        },
        {
          icon: HiShieldCheck,
          title: 'Secure payments',
          description: 'Checkout is handled by Razorpay — card details never touch our servers.',
          benefit: 'Pay with the same security as major platforms.',
        },
      ],
    },
    {
      id: 'support',
      label: 'Learn & get support',
      tagline: "You're never stuck on your own",
      features: [
        {
          icon: HiDocumentText,
          title: 'Step-by-step documentation',
          description: 'Every kit ships with a setup guide you can follow.',
          benefit: 'Complete your project even if it is your first IoT build.',
        },
        {
          icon: HiSupport,
          title: 'Technical support',
          description: 'Reach our engineers on WhatsApp or email.',
          benefit: 'Get unstuck fast when something will not compile.',
        },
      ],
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
              Everything you need to ship an IoT project
            </h2>
            <p className="text-lg text-outline max-w-2xl mx-auto">
              InovitaZ covers the whole journey — from picking a project to getting it running on your bench.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            {/* Grouped features */}
            <div className="lg:col-span-3 space-y-12">
              {featureGroups.map((group) => (
                <div key={group.id}>
                  <div className="mb-5">
                    <h3 className="text-xl font-display font-semibold text-white">
                      {group.label}
                    </h3>
                    <p className="text-sm text-outline">{group.tagline}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {group.features.map((feature) => (
                      <div
                        key={feature.title}
                        className="p-5 rounded-xl glass-panel hover:bg-surface-variant/40 transition-colors"
                      >
                        <div className="w-11 h-11 bg-surface-highest border border-primary-dim/20 rounded-lg flex items-center justify-center mb-3">
                          <feature.icon className="w-6 h-6 text-primary-dim" />
                        </div>
                        <h4 className="font-semibold text-white mb-1.5">{feature.title}</h4>
                        <p className="text-outline text-sm mb-2">{feature.description}</p>
                        <p className="text-primary-fixed text-xs font-medium">→ {feature.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Inline CTA */}
              <div className="pt-2">
                <Link to="/projects" className="btn btn-primary btn-lg inline-flex items-center gap-2">
                  Start building — browse projects
                  <HiArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Visual + social proof */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Deliverables visual (code mock) */}
                <div className="rounded-2xl border border-surface-variant bg-surface overflow-hidden shadow-[0_0_25px_rgba(59,130,246,0.1)]">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-variant bg-surface-high">
                    <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
                    <span className="ml-2 text-xs text-outline font-mono">weather_station.ino</span>
                  </div>
                  <pre className="p-4 text-xs leading-relaxed font-mono text-green-400 overflow-x-auto">{`#include <DHT.h>
#define DHT_PIN 2

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float t = dht.readTemp();
  Serial.println(t);
  delay(2000);
}`}</pre>
                </div>

                {/* Kit contents */}
                <div className="rounded-2xl border border-surface-variant bg-surface p-5">
                  <p className="text-sm font-semibold text-white mb-3">Every kit includes</p>
                  <ul className="space-y-2 text-sm text-outline">
                    {["Complete source code", "Circuit diagram", "Component list", "Setup guide (PDF)", "Lifetime downloads"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <HiCheckCircle className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Social proof — TODO: replace with real customer quotes */}
                <div className="space-y-3">
                  <figure className="rounded-2xl border border-surface-variant bg-surface p-5">
                    <blockquote className="text-sm text-outline leading-relaxed">
                      "The source code and diagrams were so complete I had my weather station running in one afternoon."
                    </blockquote>
                    <figcaption className="mt-3 text-xs text-primary-fixed font-medium">
                      — Engineering student, Andhra Pradesh
                    </figcaption>
                  </figure>
                  <figure className="rounded-2xl border border-surface-variant bg-surface p-5">
                    <blockquote className="text-sm text-outline leading-relaxed">
                      "Support replied on WhatsApp within the hour and helped me fix a wiring mistake."
                    </blockquote>
                    <figcaption className="mt-3 text-xs text-primary-fixed font-medium">
                      — Maker & hobbyist
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
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