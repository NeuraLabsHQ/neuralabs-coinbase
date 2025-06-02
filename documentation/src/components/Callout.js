import React from 'react';
import clsx from 'clsx';

export function Callout({ children, type = 'info', title, className }) {
  return (
    <div className={clsx('callout', `callout-${type}`, className)}>
      {title && <div className="callout-title">{title}</div>}
      {children}
    </div>
  );
}