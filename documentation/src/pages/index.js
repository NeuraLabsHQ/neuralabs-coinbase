import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)} style={{
      backgroundColor: '#fff',
      color: '#333',
      borderBottom: '1px solid #e5e5e5',
      padding: '4rem 0'
    }}>
      <div className="container">
        <div className="text--center">
          <h1 className="hero__title" style={{
            fontSize: '3.5rem',
            fontWeight: '300',
            color: '#1a1a1a',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>Democratizing AI Ownership</h1>
          <p className="hero__subtitle" style={{
            fontSize: '1.25rem',
            color: '#666',
            maxWidth: '800px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain. Create workflows without centralized control.</p>
          <div className={styles.buttons}>
            <Link
              className="button button--lg margin-right--md hero-btn-primary"
              to="/docs/intro">
              Documentation
            </Link>
            <Link
              className="button button--lg hero-btn-secondary"
              to="/docs/theoretical/getting-started">
              Quick Start
            </Link>
          </div>
          <div className="margin-top--xl">
            <p style={{
              color: '#888',
              fontSize: '0.9rem',
              fontWeight: '400'
            }}>
              <span style={{marginRight: '2rem'}}>Built on SUI</span>
              <span style={{marginRight: '2rem'}}>Zero-Knowledge Auth</span>
              <span>Decentralized Storage</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function CallToActionSection() {
  return (
    <section className="padding-vert--xl" style={{
      backgroundColor: '#1a1a1a',
      color: '#fff',
      borderTop: '1px solid #333'
    }}>
      <div className="container text--center">
        <h2 style={{
          color: '#fff',
          fontSize: '2.25rem',
          fontWeight: '300',
          marginBottom: '1.5rem',
          letterSpacing: '-0.01em'
        }}>Ready to Build the Future of AI?</h2>
        <p style={{
          fontSize: '1.1rem',
          marginBottom: '2.5rem',
          color: '#ccc',
          maxWidth: '600px',
          margin: '0 auto 2.5rem',
          lineHeight: '1.6'
        }}>
          Join the revolution in decentralized AI. Start building autonomous agents today.
        </p>
        <div className="margin-bottom--xl">
          <Link
            className="button button--lg margin-right--md"
            to="/docs/theoretical/getting-started"
            style={{
              backgroundColor: '#fff',
              color: '#1a1a1a',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
            Get Started Now
          </Link>
          <Link
            className="button button--lg"
            to="/docs/implementation"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: '2px solid #fff',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
            Implementation Guides
          </Link>
        </div>
        <div className="row margin-top--xl">
          <div className="col col--4">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/docs.svg" alt="Learn" style={{
                width: '32px',
                height: '32px',
                filter: 'invert(1) opacity(0.8)'
              }} />
            </div>
            <h4 style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>Learn the Concepts</h4>
            <p style={{
              color: '#ccc',
              fontSize: '0.95rem',
              margin: '0'
            }}>Understand blockchain, AI workflows, and decentralized systems</p>
          </div>
          <div className="col col--4">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/code.svg" alt="Deploy" style={{
                width: '32px',
                height: '32px',
                filter: 'invert(1) opacity(0.8)'
              }} />
            </div>
            <h4 style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>Deploy Your Agents</h4>
            <p style={{
              color: '#ccc',
              fontSize: '0.95rem',
              margin: '0'
            }}>Build and deploy autonomous AI agents on the SUI blockchain</p>
          </div>
          <div className="col col--4">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/settings.svg" alt="Monetize" style={{
                width: '32px',
                height: '32px',
                filter: 'invert(1) opacity(0.8)'
              }} />
            </div>
            <h4 style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>Monetize Workflows</h4>
            <p style={{
              color: '#ccc',
              fontSize: '0.95rem',
              margin: '0'
            }}>Earn from your AI capabilities through the creator economy</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Democratizing AI Ownership`}
      description="Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain. Create workflows without centralized control.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <CallToActionSection />
      </main>
    </Layout>
  );
}