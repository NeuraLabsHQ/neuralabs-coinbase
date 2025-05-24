import React from 'react';
import clsx from 'clsx';

export function Card({ children, className }) {
  return (
    <div className={clsx('card', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('card-header', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('card-title', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <div className={clsx('card-description', className)}>
      {children}
    </div>
  );
}