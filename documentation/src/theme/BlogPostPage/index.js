import React from 'react'; 
import Layout from '@theme/Layout'; 
import { PageMetadata } from '@docusaurus/theme-common'; 
import Link from '@docusaurus/Link'; 

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
    <Layout
      title={title}
      description={description}
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            {/* Breadcrumbs */}
            <nav className="breadcrumbs margin-bottom--md">
              <ul className="breadcrumbs__list">
                <li className="breadcrumbs__item">
                  <Link to="/blog" className="breadcrumbs__link">
                    <img src="/img/icons/docs.svg" width="16" height="16" style={{marginRight: '8px', verticalAlign: 'middle'}} />
                    Blog
                  </Link>
                </li>
                <li className="breadcrumbs__item breadcrumbs__item--active">
                  <span className="breadcrumbs__link">{title}</span>
                </li>
              </ul>
            </nav>

            {/* Article */}
            <article className="margin-bottom--xl">
              {/* Header */}
              <header className="margin-bottom--lg">
                {/* Author and metadata */}
                <div className="avatar margin-bottom--md">
                  {authors?.[0]?.imageURL && (
                    <img
                      className="avatar__photo"
                      src={authors[0].imageURL}
                      alt={authors[0].name}
                    />
                  )}
                  <div className="avatar__intro">
                    <div className="avatar__name">
                      {authors?.[0]?.name || 'NeuraLabs Team'}
                    </div>
                    <small className="avatar__subtitle">
                      {new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {readingTime && (
                        <span> · {Math.ceil(readingTime)} min read</span>
                      )}
                    </small>
                  </div>
                </div>
                
                {/* Title - reduced size */}
                <h1 className="margin-bottom--md">{title}</h1>
                
                {/* Description */}
                {description && (
                  <p className="text--secondary text--larger margin-bottom--md">
                    {description}
                  </p>
                )}
                
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="margin-bottom--md">
                    {tags.map((tag) => (
                      <Link
                        key={tag.label}
                        to={tag.permalink}
                        className="badge badge--secondary margin-right--sm margin-bottom--sm"
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                )}
              </header>
              
              {/* Content */}
              <div className="markdown">
                <BlogPostContent />
              </div>
              
              {/* Footer */}
              <footer className="margin-top--xl">
                {/* Author bio */}
                {authors?.[0] && (
                  <div className="card margin-bottom--lg">
                    <div className="card__header">
                      <div className="avatar">
                        {authors[0].imageURL && (
                          <img
                            className="avatar__photo avatar__photo--lg"
                            src={authors[0].imageURL}
                            alt={authors[0].name}
                          />
                        )}
                        <div className="avatar__intro">
                          <div className="avatar__name">About {authors[0].name}</div>
                          {authors[0].title && (
                            <small className="avatar__subtitle">{authors[0].title}</small>
                          )}
                        </div>
                      </div>
                    </div>
                    {(authors[0].bio || authors[0].url) && (
                      <div className="card__body">
                        {authors[0].bio && <p>{authors[0].bio}</p>}
                        {authors[0].url && (
                          <Link to={authors[0].url} external className="button button--outline button--sm">
                            Visit Profile
                            <img src="/img/icons/external-link.svg" width="16" height="16" style={{marginLeft: '8px', verticalAlign: 'middle'}} />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Navigation */}
                <div className="text--center">
                  <Link to="/blog" className="button button--secondary">
                    ← Back to Blog
                  </Link>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </Layout>
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
