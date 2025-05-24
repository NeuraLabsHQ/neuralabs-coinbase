import React from 'react';
import clsx from 'clsx';

export function Features({ children, className }) {
  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-3 gap-4 mt-6', className)}>
      {children}
    </div>
  );
}

export function Feature({ icon, title, description }) {
  return (
    <div className="feature-card card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}