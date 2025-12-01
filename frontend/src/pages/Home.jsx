import React from "react";

// export default function Home() {
//   return (
//     <div className="container">
//       <h1>Welcome to InovitaZ</h1>
//       <p>Marketplace for electronics & IoT projects.</p>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
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

const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <HiLightningBolt className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">Premium IoT Projects</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Build Amazing
                <span className="block text-primary-200">IoT Projects</span>
              </h1>
              
              <p className="text-lg text-primary-100 mb-8 max-w-lg">
                Get instant access to production-ready IoT and embedded systems projects. 
                Complete source code, documentation, and support included.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/projects" className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50">
                  Browse Projects
                  <HiArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/signup" className="btn btn-lg bg-primary-500 text-white hover:bg-primary-400 border-2 border-white/20">
                  Get Started
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-primary-200 text-sm">Projects</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">1000+</div>
                  <div className="text-primary-200 text-sm">Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-primary-200 text-sm">Rating</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/10 rounded-3xl blur-2xl"></div>
                <img
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600"
                  alt="IoT Projects"
                  className="relative rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose Inovitaz?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              We provide everything you need to bring your IoT ideas to life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-2xl bg-secondary-50 hover:bg-primary-50 transition-colors group"
              >
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
                Featured Projects
              </h2>
              <p className="text-lg text-secondary-600">
                Our most popular IoT and embedded systems projects
              </p>
            </div>
            <Link 
              to="/projects"
              className="hidden md:inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
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

      {/* CTA Section */}
      <section className="py-20 bg-secondary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Building?
          </h2>
          <p className="text-lg text-secondary-300 mb-8">
            Join thousands of developers and makers who trust Inovitaz for their IoT projects.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="btn btn-lg btn-primary">
              Create Free Account
            </Link>
            <Link to="/projects" className="btn btn-lg bg-secondary-800 text-white hover:bg-secondary-700">
              Explore Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;