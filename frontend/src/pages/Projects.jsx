// src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiSearch, HiFilter, HiX } from 'react-icons/hi';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { projectsAPI } from '../api/projects';

const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  // ADDED: New filter states
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '999');
  const [technology, setTechnology] = useState(searchParams.get('technology') || '');

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, [category, sort, page, difficulty, maxPrice, technology]); // MODIFIED: Added new dependencies

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectsAPI.getAll({
        search,
        category,
        sort,
        page,
        limit: 12,
        // ADDED: New filter parameters
        difficulty,
        maxPrice,
        technology,
      });

      if (response.success) {
        setProjects(response.data.projects);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await projectsAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    // ADDED: New params
    if (difficulty) params.set('difficulty', difficulty);
    if (maxPrice !== '999') params.set('maxPrice', maxPrice);
    if (technology) params.set('technology', technology);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSort('newest');
    setPage(1);
    // ADDED: Clear new filters
    setDifficulty('');
    setMaxPrice('999');
    setTechnology('');
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }, // ADDED
    { value: 'rating', label: 'Highest Rated' }, // ADDED
  ];

  // ADDED: Difficulty options
  const difficultyOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  // ADDED: Technology options
  const technologyOptions = [
    { value: '', label: 'All Technologies' },
    { value: 'arduino', label: 'Arduino' },
    { value: 'esp32', label: 'ESP32' },
    { value: 'esp8266', label: 'ESP8266' },
    { value: 'raspberry-pi', label: 'Raspberry Pi' },
    { value: 'stm32', label: 'STM32' },
    { value: 'pic', label: 'PIC' },
    { value: 'nodemcu', label: 'NodeMCU' },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Browse Projects
          </h1>
          <p className="text-secondary-600">
            Explore our collection of premium IoT and embedded systems projects
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </form>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden btn btn-secondary"
            >
              <HiFilter className="w-5 h-5 mr-2" />
              Filters {(category || difficulty || technology || maxPrice !== '999') && '•'}
            </button>

            {/* Filters (Desktop) - ENHANCED */}
            <div className="hidden lg:flex items-center gap-3 flex-wrap">
              {/* Category */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="input w-auto text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>

              {/* ADDED: Difficulty */}
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="input w-auto text-sm"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* ADDED: Technology */}
              <select
                value={technology}
                onChange={(e) => {
                  setTechnology(e.target.value);
                  setPage(1);
                }}
                className="input w-auto text-sm"
              >
                {technologyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* ADDED: Price Range */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary-600">Max:</span>
                <select
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="input w-auto text-sm"
                >
                  <option value="299">₹299</option>
                  <option value="499">₹499</option>
                  <option value="699">₹699</option>
                  <option value="999">Any Price</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="input w-auto text-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {(search || category || sort !== 'newest' || difficulty || technology || maxPrice !== '999') && (
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary btn-sm"
                >
                  <HiX className="w-4 h-4 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters - ENHANCED */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-secondary-200 space-y-4 fade-in">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* ADDED: Difficulty for mobile */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ADDED: Technology for mobile */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Technology
                </label>
                <select
                  value={technology}
                  onChange={(e) => {
                    setTechnology(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  {technologyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ADDED: Price range for mobile */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Maximum Price
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  <option value="299">Under ₹299</option>
                  <option value="499">Under ₹499</option>
                  <option value="699">Under ₹699</option>
                  <option value="999">Any Price</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(search || category || sort !== 'newest' || difficulty || technology || maxPrice !== '999') && (
                <button
                  onClick={clearFilters}
                  className="w-full btn btn-secondary"
                >
                  <HiX className="w-4 h-4 mr-1" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ADDED: Active Filters Display */}
        {(category || difficulty || technology || maxPrice !== '999') && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-secondary-600">Active filters:</span>
            {category && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                {category}
                <button onClick={() => setCategory('')} className="hover:text-primary-900">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {difficulty && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                {difficulty}
                <button onClick={() => setDifficulty('')} className="hover:text-primary-900">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {technology && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                {technology}
                <button onClick={() => setTechnology('')} className="hover:text-primary-900">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {maxPrice !== '999' && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                Max ₹{maxPrice}
                <button onClick={() => setMaxPrice('999')} className="hover:text-primary-900">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <p className="text-secondary-600 mb-6">
            Showing {projects.length} of {pagination.total || 0} projects
            {search && ` for "${search}"`}
          </p>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" text="Loading projects..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiSearch className="w-12 h-12 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              No projects found
            </h3>
            <p className="text-secondary-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button onClick={clearFilters} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    // Show first 5 pages or less
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {pagination.pages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setPage(pagination.pages)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          page === pagination.pages
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                        }`}
                      >
                        {pagination.pages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;