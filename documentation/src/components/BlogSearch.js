import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useBlogPosts } from '@docusaurus/theme-common/internal';

const BlogSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const blogPosts = useBlogPosts();
  const history = useHistory();

  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = blogPosts.filter(post => {
        const title = post.metadata.title.toLowerCase();
        const description = post.metadata.description?.toLowerCase() || '';
        const tags = post.metadata.tags.map(tag => tag.label.toLowerCase()).join(' ');
        const searchLower = searchTerm.toLowerCase();
        
        return title.includes(searchLower) || 
               description.includes(searchLower) || 
               tags.includes(searchLower);
      });
      setFilteredPosts(filtered.slice(0, 8)); // Limit to 8 results
      setIsOpen(true);
    } else {
      setFilteredPosts([]);
      setIsOpen(false);
    }
  }, [searchTerm, blogPosts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredPosts.length > 0) {
      history.push(filteredPosts[0].metadata.permalink);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handlePostClick = (permalink) => {
    history.push(permalink);
    setIsOpen(false);
    setSearchTerm('');
  };

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  return (
    <div className="blog-search-container">
      <form onSubmit={handleSearchSubmit} className="blog-search-form">
        <div className="blog-search-input-wrapper">
          <svg className="blog-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length > 2 && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="blog-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="blog-search-clear"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M18 6L6 18M6 6L18 18" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </form>
      
      {isOpen && filteredPosts.length > 0 && (
        <div className="blog-search-results">
          <div className="blog-search-results-header">
            <span className="blog-search-results-count">
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="blog-search-results-list">
            {filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="blog-search-result-item"
                onClick={() => handlePostClick(post.metadata.permalink)}
              >
                <div className="blog-search-result-content">
                  <h4 className="blog-search-result-title">
                    {highlightText(post.metadata.title, searchTerm)}
                  </h4>
                  {post.metadata.description && (
                    <p className="blog-search-result-description">
                      {highlightText(
                        post.metadata.description.substring(0, 120) + 
                        (post.metadata.description.length > 120 ? '...' : ''),
                        searchTerm
                      )}
                    </p>
                  )}
                  <div className="blog-search-result-meta">
                    <span className="blog-search-result-date">
                      {new Date(post.metadata.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {post.metadata.tags.length > 0 && (
                      <div className="blog-search-result-tags">
                        {post.metadata.tags.slice(0, 3).map((tag) => (
                          <span key={tag.label} className="blog-search-result-tag">
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredPosts.length === 8 && (
            <div className="blog-search-results-footer">
              <small>Showing first 8 results. Try a more specific search for better results.</small>
            </div>
          )}
        </div>
      )}
      
      {isOpen && searchTerm.length > 2 && filteredPosts.length === 0 && (
        <div className="blog-search-no-results">
          <p>No blog posts found for "{searchTerm}"</p>
          <small>Try different keywords or check your spelling</small>
        </div>
      )}
    </div>
  );
};

export default BlogSearch;