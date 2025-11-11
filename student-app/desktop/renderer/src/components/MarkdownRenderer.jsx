import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

// Disable syntax highlighter for now due to Electron compatibility issues
// Will use plain code blocks instead
const SyntaxHighlighter = null;
const vscDarkPlus = null;

/**
 * Markdown Renderer Component
 * Hỗ trợ đầy đủ markdown với syntax highlighting, tables, code blocks, etc.
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState(new Set());

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCodeBlocks(prev => new Set([...prev, index]));
      message.success('Đã sao chép!');
      setTimeout(() => {
        setCopiedCodeBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      message.error('Không thể sao chép');
    });
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Code blocks với syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            const codeIndex = node?.position?.start?.line || Math.random();

            if (!inline && language) {
              // Use plain code block (syntax highlighting disabled for Electron compatibility)
              return (
                <div style={{ position: 'relative', margin: '12px 0' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#1e1e1e',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottom: '1px solid #333'
                  }}>
                    <span style={{
                      color: '#888',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      fontWeight: 500
                    }}>
                      {language}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={copiedCodeBlocks.has(codeIndex) ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => handleCopyCode(codeString, codeIndex)}
                      style={{
                        color: copiedCodeBlocks.has(codeIndex) ? '#52c41a' : '#888',
                        fontSize: '12px',
                        height: '24px',
                        padding: '0 8px'
                      }}
                    >
                      {copiedCodeBlocks.has(codeIndex) ? 'Đã sao chép' : 'Sao chép'}
                    </Button>
                  </div>
                  <pre style={{
                    margin: 0,
                    borderRadius: '0 0 8px 8px',
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    overflow: 'auto',
                    fontFamily: 'Monaco, "Courier New", monospace'
                  }}>
                    <code>{codeString}</code>
                  </pre>
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="inline-code"
                style={{
                  background: '#f4f4f4',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'Monaco, "Courier New", monospace',
                  fontSize: '14px',
                  color: '#d63384'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Tables
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead style={{ background: '#f5f5f5' }}>{children}</thead>;
          },
          th({ children }) {
            return (
              <th style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td style={{
                padding: '12px',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '14px'
              }}>
                {children}
              </td>
            );
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote style={{
                margin: '16px 0',
                padding: '12px 16px',
                borderLeft: '4px solid #1890ff',
                background: '#f0f7ff',
                borderRadius: '4px',
                fontStyle: 'italic',
                color: '#666'
              }}>
                {children}
              </blockquote>
            );
          },
          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1890ff',
                  textDecoration: 'none',
                  borderBottom: '1px solid #1890ff'
                }}
                onMouseEnter={(e) => {
                  e.target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.target.style.textDecoration = 'none';
                }}
              >
                {children}
              </a>
            );
          },
          // Headers
          h1({ children }) {
            return <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '20px 0 12px 0' }}>{children}</h1>;
          },
          h2({ children }) {
            return <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '18px 0 10px 0' }}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '16px 0 8px 0' }}>{children}</h3>;
          },
          // Lists
          ul({ children }) {
            return <ul style={{ margin: '12px 0', paddingLeft: '24px' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ margin: '12px 0', paddingLeft: '24px' }}>{children}</ol>;
          },
          li({ children }) {
            return <li style={{ margin: '4px 0', lineHeight: '1.6' }}>{children}</li>;
          },
          // Paragraphs
          p({ children }) {
            return <p style={{ margin: '12px 0', lineHeight: '1.6' }}>{children}</p>;
          },
          // Strong/Bold
          strong({ children }) {
            return <strong style={{ fontWeight: 600 }}>{children}</strong>;
          },
          // Emphasis/Italic
          em({ children }) {
            return <em style={{ fontStyle: 'italic' }}>{children}</em>;
          },
          // Horizontal rule
          hr() {
            return <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

