import React, { useState } from 'react';
import CodeBlock from '@theme/CodeBlock';

export function CollapsibleCodeBlock({ 
  title, 
  description, 
  language = 'bash', 
  children,
  defaultCollapsed = true 
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="collapsible-code-block">
      <div 
        className="code-block-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          background: 'var(--ifm-color-emphasis-200)',
          padding: '12px 16px',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--ifm-toc-border-color)',
          borderBottom: isCollapsed ? '1px solid var(--ifm-toc-border-color)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <img src="/img/icons/code.svg" width="16" height="16" style={{ verticalAlign: 'middle' }} />
            <h4 style={{ margin: 0, color: 'var(--ifm-color-primary)', fontSize: '1rem' }}>
              {title}
            </h4>
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '2px 6px',
              backgroundColor: 'var(--ifm-color-primary)',
              color: 'white',
              borderRadius: '3px',
              fontWeight: '600'
            }}>
              {language.toUpperCase()}
            </span>
          </div>
          {description && (
            <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--ifm-font-color-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        <div style={{ 
          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.2s ease',
          fontSize: '0.875rem',
          color: 'var(--ifm-font-color-secondary)',
          marginLeft: '12px'
        }}>
          ▼
        </div>
      </div>
      
      {!isCollapsed && (
        <div style={{ 
          border: '1px solid var(--ifm-toc-border-color)',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          overflow: 'hidden'
        }}>
          <CodeBlock language={language}>
            {children}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}

export function InlineCodeCard({ title, description, language, code, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="collapsible-code-block" style={{ marginBottom: '1rem' }}>
      <div 
        className="code-block-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'var(--ifm-color-emphasis-200)',
          padding: '12px 16px',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--ifm-toc-border-color)',
          borderBottom: isExpanded ? 'none' : '1px solid var(--ifm-toc-border-color)',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <img src="/img/icons/code.svg" width="16" height="16" style={{ verticalAlign: 'middle' }} />
            <h4 style={{ margin: 0, color: 'var(--ifm-color-primary)', fontSize: '1rem' }}>
              {title}
            </h4>
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '2px 6px',
              backgroundColor: 'var(--ifm-color-primary)',
              color: 'white',
              borderRadius: '3px',
              fontWeight: '600'
            }}>
              {language.toUpperCase()}
            </span>
          </div>
          {description && (
            <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--ifm-font-color-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        <div style={{ 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: '0.875rem',
          color: 'var(--ifm-font-color-secondary)',
          marginLeft: '12px'
        }}>
          ▼
        </div>
      </div>
      
      {isExpanded && (
        <div style={{ 
          border: '1px solid var(--ifm-toc-border-color)',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          overflow: 'hidden'
        }}>
          <CodeBlock language={language}>
            {code}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}