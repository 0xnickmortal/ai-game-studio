'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Breadcrumb, Tag, Empty, Spin } from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  FileMarkdownOutlined,
  FileOutlined,
  HomeOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
}

function getFileIcon(entry: FileEntry) {
  if (entry.type === 'directory') return <FolderOutlined style={{ color: '#f59e0b', fontSize: 18 }} />;
  const ext = entry.extension?.toLowerCase();
  if (ext === '.md') return <FileMarkdownOutlined style={{ color: '#3b82f6', fontSize: 18 }} />;
  if (['.gd', '.cs', '.cpp', '.h', '.ts', '.js', '.py'].includes(ext || ''))
    return <CodeOutlined style={{ color: '#10b981', fontSize: 18 }} />;
  if (['.txt', '.json', '.yaml', '.yml', '.toml', '.cfg'].includes(ext || ''))
    return <FileTextOutlined style={{ color: '#8b5cf6', fontSize: 18 }} />;
  return <FileOutlined style={{ color: '#64748b', fontSize: 18 }} />;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDir = async (dirPath: string) => {
    setLoading(true);
    setFileContent(null);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setCurrentPath(dirPath);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const readFile = async (filePath: string, name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(filePath)}&read=true`);
      const data = await res.json();
      setFileContent(data.content || 'Unable to read file');
      setFileName(name);
    } catch {
      setFileContent('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDir('');
  }, []);

  const handleClick = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      fetchDir(entry.path);
    } else {
      readFile(entry.path, entry.name);
    }
  };

  // Build breadcrumb
  const pathParts = currentPath ? currentPath.split('/') : [];
  const breadcrumbItems = [
    { title: <span onClick={() => fetchDir('')} style={{ cursor: 'pointer' }}><HomeOutlined /> 根目录</span> },
    ...pathParts.map((part, i) => {
      const fullPath = pathParts.slice(0, i + 1).join('/');
      return {
        title: (
          <span onClick={() => fetchDir(fullPath)} style={{ cursor: 'pointer' }}>
            {part}
          </span>
        ),
      };
    }),
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>项目文件浏览器</Title>
            <Text type="secondary">浏览设计文档、代码、配置和模板文件</Text>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Breadcrumb items={breadcrumbItems} />
      </Card>

      <Row gutter={16}>
        {/* File list */}
        <Col span={fileContent ? 10 : 24}>
          <Card
            title={
              <span>
                <FolderOutlined style={{ marginRight: 8 }} />
                {currentPath || '项目根目录'}
              </span>
            }
            styles={{ body: { padding: 0 } }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : entries.length === 0 ? (
              <Empty description="空目录" style={{ padding: 40 }} />
            ) : (
              <div>
                {entries.map((entry) => (
                  <div
                    key={entry.path}
                    onClick={() => handleClick(entry)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {getFileIcon(entry)}
                      <span style={{ fontSize: 13 }}>
                        {entry.name}
                        {entry.extension && (
                          <Tag
                            style={{ marginLeft: 8, fontSize: 10 }}
                            color={entry.extension === '.md' ? 'blue' : 'default'}
                          >
                            {entry.extension}
                          </Tag>
                        )}
                      </span>
                    </div>
                    {entry.type === 'file' && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatSize(entry.size)}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* File preview */}
        {fileContent && (
          <Col span={14}>
            <Card
              title={
                <span>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  {fileName}
                </span>
              }
              extra={
                <Tag
                  color="blue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFileContent(null)}
                >
                  关闭预览
                </Tag>
              }
            >
              <div
                style={{
                  maxHeight: 600,
                  overflow: 'auto',
                  background: '#0f172a',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #1e293b',
                }}
              >
                <Paragraph
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: 0,
                    color: '#e2e8f0',
                  }}
                >
                  {fileContent}
                </Paragraph>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
