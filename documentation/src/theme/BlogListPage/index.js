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
      <div className="container margin-vert--lg">
        {/* Blog Header - Standardized with docs */}
        <div className="row">
          <div className="col col--8 col--offset-2">
            <header className="hero hero--primary">
              <div className="container">
                <h1 className="hero__title">
                  <img src="/img/icons/docs.svg" width="32" height="32" style={{marginRight: '12px', verticalAlign: 'middle'}} />
                  Engineering Blog
                </h1>
                <p className="hero__subtitle">
                  Technical insights, tutorials, and deep-dives into decentralized AI, blockchain development, and autonomous agent systems.
                </p>
              </div>
            </header>
          </div>
        </div>

        {/* Blog Posts List */}
        <div className="row margin-top--lg">
          <div className="col col--8 col--offset-2">
            <div className="blog-posts">
              {items.map(({ content: BlogPostContent }) => (
                <article key={BlogPostContent.metadata.permalink} className="card margin-bottom--lg">
                  <div className="card__header">
                    {/* Post metadata */}
                    <div className="avatar margin-bottom--sm">
                      {BlogPostContent.metadata.authors?.[0]?.imageURL && (
                        <img
                          className="avatar__photo avatar__photo--sm"
                          src={BlogPostContent.metadata.authors[0].imageURL}
                          alt={BlogPostContent.metadata.authors[0].name}
                        />
                      )}
                      <div className="avatar__intro">
                        <div className="avatar__name">
                          {BlogPostContent.metadata.authors?.[0]?.name || 'NeuraLabs Team'}
                        </div>
                        <small className="avatar__subtitle">
                          {new Date(BlogPostContent.metadata.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {BlogPostContent.metadata.readingTime && (
                            <span> · {Math.ceil(BlogPostContent.metadata.readingTime)} min read</span>
                          )}
                        </small>
                      </div>
                    </div>
                    
                    {/* Post title - reduced size */}
                    <h2 className="margin-bottom--sm">
                      <Link 
                        to={BlogPostContent.metadata.permalink}
                        className="text--no-decoration"
                      >
                        {BlogPostContent.metadata.title}
                      </Link>
                    </h2>
                  </div>
                  
                  <div className="card__body">
                    {/* Post description */}
                    {BlogPostContent.metadata.description && (
                      <p className="text--secondary margin-bottom--sm">
                        {BlogPostContent.metadata.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {BlogPostContent.metadata.tags.length > 0 && (
                      <div className="margin-top--sm">
                        {BlogPostContent.metadata.tags.slice(0, 4).map((tag) => (
                          <Link
                            key={tag.label}
                            to={tag.permalink}
                            className="badge badge--secondary margin-right--xs margin-bottom--xs"
                          >
                            {tag.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="card__footer">
                    <Link
                      to={BlogPostContent.metadata.permalink}
                      className="button button--primary button--sm"
                    >
                      Read more
                      <img src="/img/icons/arrow-right.svg" width="16" height="16" style={{marginLeft: '8px', verticalAlign: 'middle'}} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            
            {/* Empty state if no posts */}
            {items.length === 0 && (
              <div className="text--center padding-vert--xl">
                <img src="/img/icons/docs.svg" width="64" height="64" className="margin-bottom--md" />
                <h3>No blog posts yet</h3>
                <p className="text--secondary">Check back soon for technical insights and tutorials.</p>
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