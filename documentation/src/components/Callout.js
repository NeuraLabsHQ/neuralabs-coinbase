import React from 'react';
import clsx from 'clsx';

export function Callout({ children, type = 'info', className }) {
  return (
    <div className={clsx('callout', `callout-${type}`, className)}>
      {children}
    </div>
  );
}