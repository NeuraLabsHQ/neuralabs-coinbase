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
  // Support both emoji strings and image paths
  const isImagePath = typeof icon === 'string' && icon.startsWith('/');
  
  return (
    <div className="feature-card card">
      <div className="flex items-center gap-2 mb-2" >
        <div className="feature-icon">
          {isImagePath ? (
            <img src={icon} alt="" width="32" height="32" />
          ) : (
            icon
          )}
        </div>
        <h3 className=" m-0">{title}</h3>
      </div>
      <p>{description}</p>
    </div>
  );
}