import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Select, Spin, List, Tag, Space } from 'antd';
import { BarChartOutlined, MessageOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { telemetryAPI, feedbackAPI } from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

const { Option } = Select;

function Analytics() {
  const [telemetryStats, setTelemetryStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [telemetryRes, feedbackRes] = await Promise.all([
        telemetryAPI.stats(days).catch(() => ({ data: null })),
        feedbackAPI.stats(days).catch(() => ({ data: null }))
      ]);
      setTelemetryStats(telemetryRes.data);
      setFeedbackStats(feedbackRes.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to load analytics');
        if (errorMsg) {
          // Don't show error for analytics, just log
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
        <Select
          value={days}
          onChange={setDays}
          style={{ width: 200 }}
        >
          <Option value={1}>Last 24 hours</Option>
          <Option value={7}>Last 7 days</Option>
          <Option value={30}>Last 30 days</Option>
          <Option value={90}>Last 90 days</Option>
        </Select>
      </div>

      {loading ? (
        <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 100 }} />
      ) : (
        <>
          {/* Telemetry Stats */}
          {telemetryStats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Queries"
                    value={telemetryStats.total_queries || 0}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Avg Response Time"
                    value={Math.round(telemetryStats.average_duration_ms || 0)}
                    suffix="ms"
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Feedback"
                    value={feedbackStats?.total || 0}
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Pending Feedback"
                    value={feedbackStats?.pending || 0}
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]}>
            {/* Top Subjects */}
            {telemetryStats?.top_subjects && telemetryStats.top_subjects.length > 0 && (
              <Col xs={24} lg={12}>
                <Card title="Top Subjects" extra={<TrophyOutlined />}>
                  <List
                    dataSource={telemetryStats.top_subjects}
                    renderItem={(item, idx) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color="blue">{idx + 1}</Tag>
                              {item.subject || 'Unknown'}
                            </Space>
                          }
                          description={`${item.count} queries`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            )}

            {/* Feedback Stats */}
            {feedbackStats && (
              <Col xs={24} lg={12}>
                <Card title="Feedback Statistics">
                  <Row gutter={16}>
                    {Object.entries(feedbackStats.by_status || {}).map(([status, count]) => (
                      <Col span={12} key={status}>
                        <Statistic
                          title={status.toUpperCase()}
                          value={count}
                        />
                      </Col>
                    ))}
                  </Row>
                  {Object.keys(feedbackStats.by_type || {}).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4>By Type</h4>
                      {Object.entries(feedbackStats.by_type || {}).map(([type, count]) => (
                        <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                          <span>{type}</span>
                          <Tag>{count}</Tag>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}
    </div>
  );
}

export default Analytics;
