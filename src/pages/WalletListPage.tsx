import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Typography, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { API_BASE_URL } from '../config/api';

const { Title } = Typography;

const Container = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

interface Wallet {
  id: string;
  name: string;
  balance: string;
  status: string;
  createdAt: string;
}

const WalletListPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const columns: ColumnsType<Wallet> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => `$${Number(balance).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, wallet) => (
        <Space>
          <Button onClick={() => handleSelectWallet(wallet.id)}>
            View
          </Button>
          <Button.Group>
            <Button 
              onClick={() => handleStatusChange(wallet.id, 'FROZEN')}
              disabled={wallet.status === 'FROZEN'}
              type={wallet.status === 'FROZEN' ? 'primary' : 'default'}
            >
              Freeze
            </Button>
            <Button 
              onClick={() => handleStatusChange(wallet.id, 'ACTIVE')}
              disabled={wallet.status === 'ACTIVE'}
              type={wallet.status === 'ACTIVE' ? 'primary' : 'default'}
            >
              Activate
            </Button>
          </Button.Group>
          <Button 
            danger
            onClick={() => handleDeleteWallet(wallet.id)}
            disabled={wallet.status !== 'FROZEN'}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/wallet`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch wallets');
      }
      
      setWallets(data);
    } catch (error: any) {
      message.error(error.message || 'Error fetching wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWallet = (walletId: string) => {
    localStorage.setItem('walletId', walletId);
    navigate('/wallet');
  };

  const handleCreateNew = () => {
    localStorage.removeItem('walletId');
    navigate('/wallet');
  };

  const handleDeleteWallet = async (walletId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/${walletId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete wallet');
      }
      
      message.success('Wallet deleted successfully');
      fetchWallets(); // Refresh the list
    } catch (error: any) {
      message.error(error.message || 'Error deleting wallet');
    }
  };

  const handleStatusChange = async (walletId: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/${walletId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update wallet status');
      }
      
      message.success('Wallet status updated successfully');
      fetchWallets(); // Refresh the list
    } catch (error: any) {
      message.error(error.message || 'Error updating wallet status');
    }
  };

  return (
    <Container>
      <Header>
        <Title level={2}>All Wallets</Title>
        <Button type="primary" onClick={handleCreateNew}>
          Create New Wallet
        </Button>
      </Header>

      <Table
        columns={columns}
        dataSource={wallets}
        rowKey="id"
        loading={loading}
      />
    </Container>
  );
};

export default WalletListPage; 