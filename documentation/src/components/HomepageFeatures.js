import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    icon: '/img/icons/ai-workflow.svg',
    title: 'Autonomous AI Agents',
    description: (
      <>
        Create AI agents that can discover capabilities, negotiate costs, and 
        compose workflows autonomously. Build the future of self-organizing AI 
        systems without centralized control.
      </>
    ),
  },
  {
    icon: '/img/icons/blockchain.svg',
    title: 'Blockchain-Native Infrastructure',
    description: (
      <>
        Built on SUI blockchain with NFT-based access control, zkLogin authentication, 
        and Walrus decentralized storage. Your AI agents are truly owned by you, 
        not controlled by corporations.
      </>
    ),
  },
  {
    icon: '/img/icons/security.svg',
    title: 'Privacy-Preserving Cryptography',
    description: (
      <>
        Advanced cryptographic primitives including SUI Seal for threshold encryption, 
        zero-knowledge proofs for private computation, and VRF for verifiable randomness. 
        Secure by design.
      </>
    ),
  },
  {
    icon: '/img/icons/network.svg',
    title: 'Decentralized Execution Network',
    description: (
      <>
        Distributed HPC execution nodes with support for multiple AI providers 
        (Anthropic, DeepSeek, AWS Bedrock). Scale your workflows globally with 
        automatic load balancing and cost optimization.
      </>
    ),
  },
  {
    icon: '/img/icons/settings.svg',
    title: 'Creator Economy',
    description: (
      <>
        Monetize your AI workflows and sub-agents through automatic micropayments. 
        When other agents use your capabilities, you get paid instantly and fairly 
        according to your pricing.
      </>
    ),
  },
  {
    icon: '/img/icons/code.svg',
    title: 'Developer-First Platform',
    description: (
      <>
        Comprehensive SDKs, APIs, and visual workflow builder. From drag-and-drop 
        interfaces to custom code execution - build however you want with full 
        blockchain integration.
      </>
    ),
  },
];

function Feature({icon, title, description}) {
  return (
    <div className={clsx('col col--4')} style={{marginBottom: '2rem'}}>
      <div className="card" style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '2rem 1.5rem',
        height: '100%',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease'
      }}>
        <div className="text--center">
          <div style={{marginBottom: '1rem'}}>
            <img 
              src={icon} 
              alt={title}
              style={{
                width: '48px',
                height: '48px',
                filter: 'grayscale(100%) opacity(0.7)'
              }}
            />
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '1rem',
            lineHeight: '1.3'
          }}>{title}</h3>
          <p style={{
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: '#666',
            margin: '0'
          }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  return (
    <section className="padding-vert--xl" style={{
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e5e5e5',
      borderBottom: '1px solid #e5e5e5'
    }}>
      <div className="container">
        <div className="row text--center">
          <div className="col col--3">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/ai-workflow.svg" alt="Autonomous Agents" style={{
                width: '32px',
                height: '32px',
                filter: 'grayscale(100%) opacity(0.6)'
              }} />
            </div>
            <h4 style={{color: '#1a1a1a', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600'}}>Autonomous Agents</h4>
            <p style={{color: '#666', fontSize: '0.9rem', margin: '0'}}>Self-organizing AI network</p>
          </div>
          <div className="col col--3">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/security.svg" alt="Zero-Knowledge" style={{
                width: '32px',
                height: '32px',
                filter: 'grayscale(100%) opacity(0.6)'
              }} />
            </div>
            <h4 style={{color: '#1a1a1a', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600'}}>Zero-Knowledge</h4>
            <p style={{color: '#666', fontSize: '0.9rem', margin: '0'}}>Privacy-preserving by design</p>
          </div>
          <div className="col col--3">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/network.svg" alt="Global Network" style={{
                width: '32px',
                height: '32px',
                filter: 'grayscale(100%) opacity(0.6)'
              }} />
            </div>
            <h4 style={{color: '#1a1a1a', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600'}}>Global Network</h4>
            <p style={{color: '#666', fontSize: '0.9rem', margin: '0'}}>Decentralized execution</p>
          </div>
          <div className="col col--3">
            <div style={{marginBottom: '1rem'}}>
              <img src="/img/icons/terminal.svg" alt="Real-time" style={{
                width: '32px',
                height: '32px',
                filter: 'grayscale(100%) opacity(0.6)'
              }} />
            </div>
            <h4 style={{color: '#1a1a1a', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600'}}>Real-time</h4>
            <p style={{color: '#666', fontSize: '0.9rem', margin: '0'}}>Streaming AI responses</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomepageFeatures() {
  return (
    <>
      <section style={{
        backgroundColor: '#fff',
        padding: '5rem 0'
      }}>
        <div className="container">
          <div className="text--center margin-bottom--xl">
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '300',
              color: '#1a1a1a',
              marginBottom: '1rem',
              letterSpacing: '-0.01em'
            }}>Why Choose NeuraLabs?</h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              The first truly decentralized platform for autonomous AI agents
            </p>
          </div>
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>
      <StatsSection />
    </>
  );
}