import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { PageMetadata } from '@docusaurus/theme-common';

function BlogListPageMetadata(props) {
  const { metadata } = props;
  return (
    <PageMetadata
      title={metadata.blogTitle}
      description={metadata.blogDescription}
    />
  );
}

function BlogListPageContent(props) {
  const { metadata, items } = props;
  
  return (
    <Layout
      title={metadata.blogTitle}
      description={metadata.blogDescription}
    >
      {/* Full-Width Hero Section - True 100% width */}
      <div className="hero margin-bottom--xl" style={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        background: `
          linear-gradient(135deg, 
            var(--ifm-color-primary-lightest) 0%, 
            var(--ifm-color-secondary-lightest) 50%,
            var(--ifm-color-primary-lightest) 100%)
        `,
        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
        overflow: 'hidden'
      }}>
        {/* Enhanced background pattern - theme aware */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(var(--ifm-font-color-base-rgb, 0,0,0), 0.1) 0%, transparent 40%),
            radial-gradient(circle at 75% 75%, rgba(var(--ifm-font-color-base-rgb, 0,0,0), 0.05) 0%, transparent 40%),
            linear-gradient(45deg, transparent 40%, rgba(var(--ifm-font-color-base-rgb, 0,0,0), 0.02) 50%, transparent 60%)
          `,
          mixBlendMode: 'overlay',
          pointerEvents: 'none'
        }} />
        
        <div className="container padding-vert--xl" style={{position: 'relative', zIndex: 1}}>
          <div className="row">
            <div className="col col--8 col--offset-2 text--center">
              {/* Icon and title */}
              <div className="margin-bottom--lg">
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'var(--ifm-color-primary)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <img src="/img/icons/docs.svg" width="40" height="40" style={{
                    filter: 'brightness(0) invert(1)'
                  }} />
                </div>
                
                <h1 style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: '800',
                  color: 'var(--ifm-heading-color)',
                  marginBottom: '1rem',
                  lineHeight: '1.2'
                }}>
                  Engineering Blog
                </h1>
              </div>
              
              <p style={{
                fontSize: '1.2rem',
                color: 'var(--ifm-color-content-secondary)',
                maxWidth: '600px',
                margin: '0 auto 2rem auto',
                lineHeight: '1.6'
              }}>
                Technical insights, tutorials, and deep-dives into decentralized AI, blockchain development, and autonomous agent systems.
              </p>
              
              {/* Category highlights */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {[
                  { icon: 'code', label: 'Technical Tutorials' },
                  { icon: 'blockchain', label: 'Blockchain Insights' },
                  { icon: 'ai-workflow', label: 'AI Development' }
                ].map((item, index) => (
                  <div key={index} className="badge badge--secondary" style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    borderRadius: '16px',
                    background: 'var(--ifm-color-emphasis-100)',
                    color: 'var(--ifm-color-content)',
                    border: '1px solid var(--ifm-color-emphasis-300)'
                  }}>
                    <img src={`/img/icons/${item.icon}.svg`} width="16" height="16" style={{
                      marginRight: '6px', 
                      verticalAlign: 'middle',
                      opacity: '0.8'
                    }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Blog Index/Navigation */}
        <div className="row margin-bottom--xl">
          <div className="col col--10 col--offset-1">
            <div style={{
              background: 'var(--ifm-background-surface-color)',
              border: '1px solid var(--ifm-color-emphasis-200)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div className="row">
                <div className="col col--8">
                  <h3 style={{margin: '0 0 1rem 0', color: 'var(--ifm-heading-color)'}}>
                    <img src="/img/icons/info.svg" width="20" height="20" style={{marginRight: '8px', verticalAlign: 'middle'}} />
                    Latest Articles
                  </h3>
                  <p style={{margin: '0', color: 'var(--ifm-color-content-secondary)', fontSize: '0.95rem'}}>
                    {items.length} article{items.length !== 1 ? 's' : ''} covering blockchain development, AI workflows, and technical insights
                  </p>
                </div>
                <div className="col col--4 text--right">
                  <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                    <div className="dropdown dropdown--hoverable">
                      <button className="button button--outline button--sm dropdown__toggle" style={{borderRadius: '12px'}}>
                        <img src="/img/icons/settings.svg" width="14" height="14" style={{marginRight: '6px', verticalAlign: 'middle'}} />
                        Filter
                      </button>
                      <ul className="dropdown__menu">
                        <li><a className="dropdown__link" href="#recent">Recent Posts</a></li>
                        <li><a className="dropdown__link" href="#blockchain">Blockchain</a></li>
                        <li><a className="dropdown__link" href="#ai">AI & ML</a></li>
                        <li><a className="dropdown__link" href="#tutorials">Tutorials</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts List with enhanced design */}
        <div className="row">
          <div className="col col--10 col--offset-1">
            <div className="blog-posts">
              {items.map(({ content: BlogPostContent }, index) => (
                <article 
                  key={BlogPostContent.metadata.permalink} 
                  className="card margin-bottom--xl"
                  style={{
                    border: '1px solid var(--ifm-color-emphasis-200)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    background: 'var(--ifm-background-surface-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div className="card__header" style={{
                    background: 'var(--ifm-color-emphasis-100)',
                    borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                    padding: '1.5rem'
                  }}>
                    {/* Post metadata with enhanced styling */}
                    <div className="avatar margin-bottom--md">
                      {BlogPostContent.metadata.authors?.[0]?.imageURL && (
                        <img
                          className="avatar__photo"
                          src={BlogPostContent.metadata.authors[0].imageURL}
                          alt={BlogPostContent.metadata.authors[0].name}
                          style={{
                            border: '3px solid var(--ifm-background-color)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                      )}
                      <div className="avatar__intro">
                        <div className="avatar__name" style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--ifm-heading-color)'}}>
                          {BlogPostContent.metadata.authors?.[0]?.name || 'NeuraLabs Team'}
                        </div>
                        <div className="avatar__subtitle" style={{fontSize: '0.9rem', color: 'var(--ifm-color-content-secondary)'}}>
                          <img src="/img/icons/terminal.svg" width="14" height="14" style={{marginRight: '6px', verticalAlign: 'middle', opacity: '0.7'}} />
                          {new Date(BlogPostContent.metadata.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {BlogPostContent.metadata.readingTime && (
                            <span> · {Math.ceil(BlogPostContent.metadata.readingTime)} min read</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Post title with better typography */}
                    <h2 style={{
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                      lineHeight: '1.3',
                      marginBottom: '1rem',
                      fontWeight: '700'
                    }}>
                      <Link 
                        to={BlogPostContent.metadata.permalink}
                        className="text--no-decoration"
                        style={{
                          color: 'var(--ifm-heading-color)',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        {BlogPostContent.metadata.title}
                      </Link>
                    </h2>
                  </div>
                  
                  <div className="card__body" style={{padding: '1.5rem'}}>
                    {/* Post description with better styling */}
                    {BlogPostContent.metadata.description && (
                      <p style={{
                        fontSize: '1.1rem',
                        lineHeight: '1.7',
                        color: 'var(--ifm-color-content-secondary)',
                        marginBottom: '1.5rem'
                      }}>
                        {BlogPostContent.metadata.description}
                      </p>
                    )}
                    
                    {/* Tags with enhanced design */}
                    {BlogPostContent.metadata.tags.length > 0 && (
                      <div className="margin-bottom--md">
                        <div style={{marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--ifm-color-content-secondary)'}}>
                          Topics:
                        </div>
                        {BlogPostContent.metadata.tags.slice(0, 4).map((tag) => (
                          <Link
                            key={tag.label}
                            to={tag.permalink}
                            className="badge badge--primary margin-right--sm margin-bottom--sm"
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontWeight: '500',
                              background: 'var(--ifm-color-emphasis-200)',
                              color: 'var(--ifm-color-content)',
                              border: '1px solid var(--ifm-color-emphasis-300)'
                            }}
                          >
                            {tag.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="card__footer" style={{
                    padding: '1.5rem',
                    background: 'var(--ifm-background-color)',
                    borderTop: '1px solid var(--ifm-color-emphasis-200)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Link
                        to={BlogPostContent.metadata.permalink}
                        className="button button--primary"
                        style={{
                          borderRadius: '20px',
                          padding: '0.6rem 1.5rem',
                          fontWeight: '500'
                        }}
                      >
                        Read Article
                        <img src="/img/icons/arrow-right.svg" width="16" height="16" style={{
                          marginLeft: '8px', 
                          verticalAlign: 'middle',
                          filter: 'brightness(0) invert(1)'
                        }} />
                      </Link>
                      
                      <div style={{fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)'}}>
                        <img src="/img/icons/info.svg" width="14" height="14" style={{marginRight: '4px', verticalAlign: 'middle', opacity: '0.7'}} />
                        {BlogPostContent.metadata.readingTime ? 
                          `${Math.ceil(BlogPostContent.metadata.readingTime)} min read` : 
                          '5 min read'
                        }
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            
            {/* Enhanced empty state */}
            {items.length === 0 && (
              <div className="text--center padding-vert--xl">
                <div style={{
                  background: 'var(--ifm-color-emphasis-100)',
                  borderRadius: '20px',
                  padding: '3rem 2rem',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  <img src="/img/icons/docs.svg" width="80" height="80" className="margin-bottom--lg" style={{opacity: '0.6'}} />
                  <h3 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>No blog posts yet</h3>
                  <p className="text--secondary" style={{fontSize: '1.1rem', lineHeight: '1.6'}}>
                    We're working on bringing you technical insights and tutorials. Check back soon!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function BlogListPage(props) {
  return (
    <>
      <BlogListPageMetadata {...props} />
      <BlogListPageContent {...props} />
    </>
  );
}