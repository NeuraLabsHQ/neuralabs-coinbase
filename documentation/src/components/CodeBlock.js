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
    <div className="collapsible-code-block" style={{ 
      margin: '1.5rem 0',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid var(--ifm-toc-border-color)',
      background: 'var(--ifm-background-surface-color)',
      transition: 'all 0.2s ease-in-out'
    }}>
      <div 
        className="code-block-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--ifm-toc-border-color)',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <div style={{ flex: 1, textAlign: 'left', width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: description ? '6px' : '0',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            width: '100%'
          }}>
            <img 
              src="/img/icons/code.svg" 
              width="16" 
              height="16" 
              style={{ 
                verticalAlign: 'middle',
                opacity: 0.7,
                flexShrink: 0
              }} 
            />
            <h4 style={{ 
              margin: 0, 
              color: 'var(--ifm-font-color-base)', 
              fontSize: '1rem',
              fontWeight: '600',
              textAlign: 'left',
              flex: '0 1 auto'
            }}>
              {title}
            </h4>
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '2px 6px',
              background: 'var(--ifm-toc-border-color)',
              color: 'var(--ifm-font-color-secondary)',
              borderRadius: '4px',
              fontWeight: '500',
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {language}
            </span>
          </div>
          {description && (
            <p style={{ 
              margin: '0', 
              fontSize: '0.875rem', 
              color: 'var(--ifm-font-color-secondary)',
              lineHeight: '1.4',
              textAlign: 'left',
              width: '100%'
            }}>
              {description}
            </p>
          )}
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.2s ease-in-out',
          marginLeft: '12px',
          opacity: 0.6,
          flexShrink: 0
        }}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--ifm-font-color-base)"
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
      </div>
      
      {!isCollapsed && (
        <div style={{ 
          background: 'var(--ifm-pre-background)',
          borderRadius: '0',
          overflow: 'hidden'
        }}>
          <CodeBlock language={language} style={{ margin: 0, textAlign: 'left' }}>
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
    <div className="collapsible-code-block" style={{ 
      margin: '1.5rem 0',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid var(--ifm-toc-border-color)',
      background: 'var(--ifm-background-surface-color)',
      transition: 'all 0.2s ease-in-out'
    }}>
      <div 
        className="code-block-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid var(--ifm-toc-border-color)' : 'none',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <div style={{ flex: 1, textAlign: 'left', width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: description ? '6px' : '0',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            width: '100%'
          }}>
            <img 
              src="/img/icons/code.svg" 
              width="16" 
              height="16" 
              style={{ 
                verticalAlign: 'middle',
                opacity: 0.7,
                flexShrink: 0
              }} 
            />
            <h4 style={{ 
              margin: 0, 
              color: 'var(--ifm-font-color-base)', 
              fontSize: '1rem',
              fontWeight: '600',
              textAlign: 'left',
              flex: '0 1 auto'
            }}>
              {title}
            </h4>
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '2px 6px',
              background: 'var(--ifm-toc-border-color)',
              color: 'var(--ifm-font-color-secondary)',
              borderRadius: '4px',
              fontWeight: '500',
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {language}
            </span>
          </div>
          {description && (
            <p style={{ 
              margin: '0', 
              fontSize: '0.875rem', 
              color: 'var(--ifm-font-color-secondary)',
              lineHeight: '1.4',
              textAlign: 'left',
              width: '100%'
            }}>
              {description}
            </p>
          )}
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease-in-out',
          marginLeft: '12px',
          opacity: 0.6,
          flexShrink: 0
        }}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--ifm-font-color-base)"
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{ 
          background: 'var(--ifm-pre-background)',
          borderRadius: '0',
          overflow: 'hidden'
        }}>
          <CodeBlock language={language} style={{ margin: 0, textAlign: 'left' }}>
            {code}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}