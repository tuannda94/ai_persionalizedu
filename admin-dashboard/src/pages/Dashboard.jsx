import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, List, Tag } from 'antd';
import { UserOutlined, MessageOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';
import { telemetryAPI, feedbackAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [telemetryRes, feedbackRes] = await Promise.all([
        telemetryAPI.stats(7).catch((err) => {
          console.error('Telemetry stats error:', err);
          return { data: null };
        }),
        feedbackAPI.stats(7).catch((err) => {
          console.error('Feedback stats error:', err);
          return { data: null };
        })
      ]);

      console.log('Telemetry stats:', telemetryRes.data);
      console.log('Feedback stats:', feedbackRes.data);

      setStats(telemetryRes.data);
      setFeedbackStats(feedbackRes.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 100 }} />;
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Queries"
              value={stats?.total_queries || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Duration"
              value={stats?.average_duration_ms || 0}
              suffix="ms"
              prefix={<BarChartOutlined />}
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
              value={feedbackStats?.by_status?.pending || 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {stats?.top_subjects && stats.top_subjects.length > 0 && (
        <Card title="Top Subjects (Last 7 days)" style={{ marginTop: 24 }}>
          <List
            dataSource={stats.top_subjects}
            renderItem={(item, idx) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      <Tag color="blue">{idx + 1}</Tag>
                      {item.subject || 'Unknown'}
                    </span>
                  }
                  description={`${item.count} queries`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
