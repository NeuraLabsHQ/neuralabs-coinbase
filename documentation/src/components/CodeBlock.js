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
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderBottom: isCollapsed ? '1px solid var(--ifm-color-emphasis-300)' : 'none'
        }}
      >
        <div>
          <h4 style={{ margin: 0, color: 'var(--ifm-color-primary)' }}>
            <img src="/img/icons/code.svg" width="16" height="16" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            {title}
          </h4>
          {description && (
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9em', opacity: 0.8 }}>
              {description}
            </p>
          )}
          <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
            Language: {language.toUpperCase()}
          </span>
        </div>
        <div style={{ 
          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </div>
      </div>
      
      {!isCollapsed && (
        <div style={{ 
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px'
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
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderBottom: isExpanded ? 'none' : '1px solid var(--ifm-color-emphasis-300)'
        }}
      >
        <div>
          <h4 style={{ margin: 0, color: 'var(--ifm-color-primary)' }}>
            <img src="/img/icons/code.svg" width="16" height="16" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            {title}
          </h4>
          {description && (
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9em', opacity: 0.8 }}>
              {description}
            </p>
          )}
          <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
            Language: {language.toUpperCase()}
          </span>
        </div>
        <div style={{ 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </div>
      </div>
      
      {isExpanded && (
        <div style={{ 
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px'
        }}>
          <CodeBlock language={language}>
            {code}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}