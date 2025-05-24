import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'AI Workflow Builder',
    description: (
      <>
        Create and deploy AI workflows with our intuitive visual builder. 
        Connect multiple AI models, data sources, and custom logic blocks 
        to build powerful automation pipelines.
      </>
    ),
  },
  {
    title: 'Blockchain-Powered Access Control',
    description: (
      <>
        Leverage SUI blockchain and NFT-based access control to manage 
        permissions and monetize your AI workflows. Built-in support for 
        encrypted data management with SUI Seal.
      </>
    ),
  },
  {
    title: 'Decentralized Execution',
    description: (
      <>
        Run AI workflows on our distributed HPC execution nodes. Support 
        for multiple AI providers including Anthropic, DeepSeek, and AWS 
        Bedrock with streaming responses.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}