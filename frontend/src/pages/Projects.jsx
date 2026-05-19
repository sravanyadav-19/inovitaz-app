/**
 * Projects Page
 * Browse projects with filters and search
 */

import { useState, useEffect, useCallback } from 'react';
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
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "99900");
  const [technology, setTechnology] = useState(searchParams.get('technology') || '');

  // Fetch projects when filters change
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectsAPI.getAll({
        search,
        category,
        sort,
        page,
        limit: 12,
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
  }, [search, category, sort, page, difficulty, maxPrice, technology]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset pagination
    updateSearchParams();
  };

  // Update URL search params
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    if (difficulty) params.set('difficulty', difficulty);
    if (maxPrice !== "99900") params.set("maxPrice", maxPrice);
    if (technology) params.set('technology', technology);
    setSearchParams(params);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSort('newest');
    setPage(1);
    setDifficulty('');
    setMaxPrice("99900");
    setTechnology('');
    setSearchParams({});
  };

  // Filter change handlers - ALWAYS reset page to 1
  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleDifficultyChange = (value) => {
    setDifficulty(value);
    setPage(1);
  };

  const handleTechnologyChange = (value) => {
    setTechnology(value);
    setPage(1);
  };

  const handleMaxPriceChange = (value) => {
    setMaxPrice(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const difficultyOptions = [
    { value: '', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  const technologyOptions = [
    { value: '', label: 'All Technologies' },
    { value: 'arduino', label: 'Arduino' },
    { value: 'esp32', label: 'ESP32' },
    { value: 'esp8266', label: 'ESP8266' },
    { value: 'raspberry-pi', label: 'Raspberry Pi' },
    { value: 'stm32', label: 'STM32' },
    { value: 'nodemcu', label: 'NodeMCU' },
  ];

  const hasActiveFilters = category || difficulty || technology || maxPrice !== "99900";

  return (
    <div className="min-h-screen bg-surface fade-in">
      {/* Header */}
      <div className="bg-surface-lowest border-b border-surface-variant/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
          {/* Subtle glow behind header */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-DEFAULT/5 rounded-full blur-3xl"></div>
          
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-2 relative z-10">
            Database querying <span className="animate-pulse text-secondary-DEFAULT">_</span>
          </h1>
          <p className="text-outline relative z-10">
            Explore our repository of premium IoT and embedded systems modules.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="glass-panel rounded-xl p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="text"
                  placeholder="Search metadata..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 bg-surface text-white placeholder-outline-variant font-medium tracking-wide"
                />
              </div>
            </form>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden btn btn-secondary"
            >
              <HiFilter className="w-5 h-5 mr-2" />
              Filters {hasActiveFilters && '•'}
            </button>

            {/* Filters (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 flex-wrap">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input w-auto text-sm bg-surface text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="input w-auto text-sm bg-surface text-white"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={technology}
                onChange={(e) => handleTechnologyChange(e.target.value)}
                className="input w-auto text-sm bg-surface text-white"
              >
                {technologyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-outline font-medium">MAX:</span>
                <select
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="input w-auto text-sm bg-surface text-white"
                >
                  <option value="29900">₹299</option>
                  <option value="49900">₹499</option>
                  <option value="69900">₹699</option>
                  <option value="99900">Any</option>
                </select>
              </div>

              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input w-auto text-sm bg-surface text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {(search || hasActiveFilters || sort !== 'newest') && (
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

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-secondary-200 space-y-4 fade-in">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value)}
                  className="input"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Technology
                </label>
                <select
                  value={technology}
                  onChange={(e) => handleTechnologyChange(e.target.value)}
                  className="input"
                >
                  {technologyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Maximum Price
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="input"
                >
                  <option value="29900">Under ₹299</option>
                  <option value="49900">Under ₹499</option>
                  <option value="69900">Under ₹699</option>
                  <option value="99900">Any Price</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(search || hasActiveFilters || sort !== 'newest') && (
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

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-outline font-medium tracking-wide">ACTIVE_FILTERS:</span>
            {category && (
              <span className="px-2 py-1 bg-surface-highest border border-primary-dim/30 text-primary-dim rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
                {category}
                <button aria-label="Remove category filter" onClick={() => handleCategoryChange('')} className="hover:text-white transition-colors">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {difficulty && (
              <span className="px-2 py-1 bg-surface-highest border border-primary-dim/30 text-primary-dim rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
                {difficulty}
                <button onClick={() => handleDifficultyChange('')} className="hover:text-white transition-colors">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {technology && (
              <span className="px-2 py-1 bg-surface-highest border border-primary-dim/30 text-primary-dim rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
                {technology}
                <button onClick={() => handleTechnologyChange('')} className="hover:text-white transition-colors">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {maxPrice !== "99900" && (
              <span className="px-2 py-1 bg-surface-highest border border-primary-dim/30 text-primary-dim rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
                Max ₹{Math.round(Number(maxPrice || 0) / 100)}
                <button onClick={() => handleMaxPriceChange("99900")} className="hover:text-white transition-colors">
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <p className="text-outline mb-6 text-sm font-mono opacity-80">
            &gt; FOUND_MODULES: {projects.length} OF {pagination.total || 0}
            {search && ` FOR QUERY [${search}]`}
          </p>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" text="Loading projects..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-surface-lowest border border-surface-variant rounded-xl glass-panel">
            <div className="w-24 h-24 bg-surface-highest rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <HiSearch className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">
              No projects found
            </h3>
            <p className="text-outline mb-6">
              Try adjusting your search or filter criteria
            </p>
            <button onClick={clearFilters} className="btn btn-primary px-6 py-2">
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
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.pages || Math.abs(page - p) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && arr[i - 1] !== p - 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((pageNum, i) => 
                      pageNum === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 self-end mb-2 text-outline">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-primary-DEFAULT text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                              : 'bg-surface-lowest text-outline border border-outline-variant/30 hover:bg-surface-highest hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
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