import React from 'react'; 
import Layout from '@theme/Layout'; 
import { PageMetadata } from '@docusaurus/theme-common'; 
import Link from '@docusaurus/Link'; 
import '@site/src/css/blog.css'; 

function BlogPostPageMetadata(props) { 
  const { content: BlogPostContent } = props; 
  const { metadata, frontMatter } = BlogPostContent; 
  const { title, description, date, tags, authors, image } = metadata; 
  const { keywords } = frontMatter; 
  
  return (
 < PageMetadata
      title = { title }
      description = { description }
      keywords = { keywords }
      image = { image }
 >
      {/* Open Graph meta tags for social sharing */ } 
 < meta property ="og:type" content="article" />
      <meta property="article:published_time" content={date} />
      {authors.map((author, index) => (
        <meta key={index} property="article:author" content={author.name} />
      ))}
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag.label} />
      ))}
    </PageMetadata>
  );
}

function BlogPostPageContent(props) {
  const { content: BlogPostContent } = props;
  const { metadata, frontMatter } = BlogPostContent;
  const { title, description, date, tags, authors, readingTime, permalink } = metadata;
  
  // Calculate reading time if not provided
  const estimatedReadingTime = readingTime ? 
    `${Math.ceil(readingTime)} min read` : 
    '5 min read';
  
  return (
    <div className="blog-page">
      <Layout
        title={title}
        description={description}
      >
        {/* Full-Width Hero Section - True 100% width */}
        <div className="blog-hero" style={{
          borderBottom: '1px solid var(--ifm-color-emphasis-200)'
        }}>
          {/* Enhanced background pattern - theme aware */}
          <div className="blog-pattern-overlay" />
        
        <div className="container padding-vert--xl" style={{position: 'relative', zIndex: 1}}>
          <div className="row">
            <div className="col col--8 col--offset-2">
              {/* Breadcrumbs */}
              <nav className="breadcrumbs margin-bottom--lg">
                <ul className="breadcrumbs__list">
                  <li className="breadcrumbs__item">
                    <Link to="/blog" className="breadcrumbs__link">
                      <img src="/img/icons/docs.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.8'}} />
                      Engineering Blog
                    </Link>
                  </li>
                  <li className="breadcrumbs__item breadcrumbs__item--active">
                    <span className="breadcrumbs__link">{title}</span>
                  </li>
                </ul>
              </nav>

              {/* Author and metadata */}
              <div className="avatar margin-bottom--lg">
                {authors?.[0]?.imageURL && (
                  <img
                    className="avatar__photo avatar__photo--lg"
                    src={authors[0].imageURL}
                    alt={authors[0].name}
                    style={{
                      border: '3px solid var(--ifm-background-color)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                    }}
                  />
                )}
                <div className="avatar__intro">
                  <div className="avatar__name" style={{color: 'var(--ifm-heading-color)', fontSize: '1.2rem', fontWeight: '600'}}>
                    {authors?.[0]?.name || 'NeuraLabs Team'}
                  </div>
                  <div className="avatar__subtitle" style={{color: 'var(--ifm-color-content-secondary)', fontSize: '1rem'}}>
                    <img src="/img/icons/terminal.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.7'}} />
                    {new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {readingTime && (
                      <span> · {Math.ceil(readingTime)} min read</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Title with enhanced typography */}
              <h1 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                lineHeight: '1.2',
                marginBottom: '1.5rem',
                color: 'var(--ifm-heading-color)',
                fontWeight: '800'
              }}>
                {title}
              </h1>
              
              {/* Description */}
              {description && (
                <p style={{
                  fontSize: '1.3rem',
                  color: 'var(--ifm-color-content-secondary)',
                  lineHeight: '1.6',
                  maxWidth: '90%'
                }}>
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="container">
        <div className="row">
          {/* Table of Contents Sidebar */}
          <div className="col col--3">
            <div className="blog-sidebar">
              <h4>
                <img src="/img/icons/docs.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.8'}} />
                Table of Contents
              </h4>
              <div style={{fontSize: '0.9rem', color: 'var(--ifm-color-content-secondary)'}}>
                Navigate through the article sections
              </div>
            </div>
            
            {/* Blog Navigation */}
            <div className="blog-sidebar">
              <h4>
                <img src="/img/icons/arrow-right.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.8', transform: 'rotate(180deg)'}} />
                Blog Navigation
              </h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                <Link 
                  to="/blog" 
                  className="blog-sidebar-link"
                >
                  ← All Blog Posts
                </Link>
                <div style={{fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)'}}>
                  Reading Progress
                </div>
                <div className="blog-reading-progress">
                  <div className="blog-reading-progress-bar" id="reading-progress"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Article Content */}
          <div className="col col--6">
            <article>
              {/* Tags - moved below hero */}
              {tags.length > 0 && (
                <div className="blog-tags-section">
                  <div className="blog-tags-label">
                    Filed under:
                  </div>
                  {tags.map((tag) => (
                    <Link
                      key={tag.label}
                      to={tag.permalink}
                      className="blog-tag"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Content with enhanced typography */}
              <div className="blog-article-content markdown">
                <BlogPostContent />
              </div>
              
              {/* Enhanced Footer */}
              <footer className="margin-top--xl">
                {/* Divider */}
                <hr style={{
                  margin: '3rem 0 2rem 0',
                  border: 'none',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, var(--ifm-color-emphasis-300), transparent)'
                }} />
                
                {/* Author bio with enhanced design */}
                {authors?.[0] && (
                  <div className="card margin-bottom--xl" style={{
                    background: 'var(--ifm-background-surface-color)',
                    border: '1px solid var(--ifm-color-emphasis-200)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                  }}>
                    <div className="card__header" style={{
                      background: 'var(--ifm-color-emphasis-100)',
                      borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                    }}>
                      <div className="avatar">
                        {authors[0].imageURL && (
                          <img
                            className="avatar__photo avatar__photo--lg"
                            src={authors[0].imageURL}
                            alt={authors[0].name}
                            style={{
                              border: '3px solid var(--ifm-background-color)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          />
                        )}
                        <div className="avatar__intro">
                          <div className="avatar__name" style={{fontSize: '1.2rem', fontWeight: '600', color: 'var(--ifm-heading-color)'}}>
                            <img src="/img/icons/prover.svg" width="20" height="20" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.8'}} />
                            About {authors[0].name}
                          </div>
                          {authors[0].title && (
                            <small className="avatar__subtitle" style={{fontSize: '0.95rem', color: 'var(--ifm-color-content-secondary)'}}>
                              {authors[0].title}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                    {(authors[0].bio || authors[0].url) && (
                      <div className="card__body">
                        {authors[0].bio && (
                          <p style={{
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'var(--ifm-color-content)',
                            marginBottom: authors[0].url ? '1rem' : '0'
                          }}>
                            {authors[0].bio}
                          </p>
                        )}
                        {authors[0].url && (
                          <Link 
                            to={authors[0].url} 
                            external 
                            className="button button--primary button--sm"
                            style={{borderRadius: '20px'}}
                          >
                            <img src="/img/icons/external-link.svg" width="16" height="16" style={{
                              marginRight: '6px', 
                              verticalAlign: 'middle',
                              filter: 'brightness(0) invert(1)'
                            }} />
                            Visit Profile
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Enhanced Navigation */}
                <div className="text--center padding-vert--lg">
                  <Link 
                    to="/blog" 
                    className="button button--secondary button--lg"
                    style={{
                      borderRadius: '25px',
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    <img src="/img/icons/arrow-right.svg" width="18" height="18" style={{
                      marginRight: '8px', 
                      verticalAlign: 'middle', 
                      transform: 'rotate(180deg)',
                      opacity: '0.8'
                    }} />
                    Back to Engineering Blog
                  </Link>
                </div>
              </footer>
            </article>
          </div>
          
          {/* Right Sidebar - Related Content */}
          <div className="col col--3">
            <div className="blog-sidebar">
              <h4>
                <img src="/img/icons/info.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.8'}} />
                Article Info
              </h4>
              <div className="blog-article-meta">
                <div className="blog-article-meta-item">
                  <strong>Published:</strong><br />
                  {new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                {readingTime && (
                  <div className="blog-article-meta-item">
                    <strong>Reading Time:</strong><br />
                    {Math.ceil(readingTime)} minutes
                  </div>
                )}
                {authors?.[0] && (
                  <div className="blog-article-meta-item">
                    <strong>Author:</strong><br />
                    {authors[0].name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Share Section */}
            <div className="blog-sidebar">
              <h4>
                <img src="/img/icons/external-link.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle', opacity: '0.8'}} />
                Share Article
              </h4>
              <div>
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`https://docs.neuralabs.ai${permalink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blog-share-link"
                >
                  Share on Twitter
                </a>
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://docs.neuralabs.ai${permalink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blog-share-link"
                >
                  Share on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Layout>
    </div>
  );
}

export default function BlogPostPage(props) {
  return (
    <>
      <BlogPostPageMetadata {...props} />
      <BlogPostPageContent {...props} />
    </>
  );
}
