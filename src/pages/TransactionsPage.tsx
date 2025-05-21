import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Table, Button, Space, Modal, message, Alert } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { API_BASE_URL } from '../config/api';

const { confirm } = Modal;

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

interface TableParams {
  pagination: TablePaginationConfig;
  sorter?: SorterResult<any> | SorterResult<any>[];
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [wallet, setWallet] = useState<{ status: string } | null>(null);
  const navigate = useNavigate();

  const fetchTransactions = async (params: TableParams) => {
    const walletId = localStorage.getItem('walletId');
    if (!walletId) {
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const { pagination, sorter } = params;
      const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
      
      // Map frontend field names to backend field names
      const sortFieldMap: { [key: string]: string } = {
        createdAt: 'createdAt',
        amount: 'amount'
      };

      // Build query parameters
      const queryParams = new URLSearchParams({
        walletId,
        skip: String((pagination.current! - 1) * pagination.pageSize!),
        limit: String(pagination.pageSize),
        sort: currentSorter?.field ? sortFieldMap[currentSorter.field.toString()] || 'createdAt' : 'createdAt',
        order: currentSorter?.order === 'ascend' ? 'ASC' : 'DESC'
      });

      const response = await fetch(
        `${API_BASE_URL}/transactions?${queryParams.toString()}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      setTransactions(data.transactions);
      setPagination({
        ...pagination,
        total: data.pagination.total
      });
    } catch (error: any) {
      message.error(error.message || 'Error fetching transactions');
    }
    setLoading(false);
  };

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[]
  ) => {
    fetchTransactions({
      pagination: newPagination,
      sorter
    });
  };

  const exportCSV = async () => {
    const walletId = localStorage.getItem('walletId');
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/export?walletId=${walletId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
    } catch (error) {
      console.error('Error exporting transactions:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete transaction');
      }
      
      message.success('Transaction deleted successfully');
      fetchTransactions({
        pagination: { current: 1, pageSize: 10 }
      });
    } catch (error: any) {
      message.error(error.message || 'Error deleting transaction');
    }
  };

  const handleDeleteAll = async () => {
    const walletId = localStorage.getItem('walletId');
    if (!walletId) return;

    confirm({
      title: 'Are you sure you want to delete all transactions?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone. Wallet must be frozen first.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/transactions/wallet/${walletId}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Failed to delete transactions');
          }
          
          message.success('All transactions deleted successfully');
          fetchTransactions({
            pagination: { current: 1, pageSize: 10 }
          });
          fetchWallet();
        } catch (error: any) {
          message.error(error.message || 'Error deleting transactions');
        }
      }
    });
  };

  const fetchWallet = async () => {
    const walletId = localStorage.getItem('walletId');
    if (!walletId) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wallet/${walletId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch wallet');
      }
      
      setWallet(data);
    } catch (error: any) {
      message.error(error.message || 'Error fetching wallet');
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions({
      pagination: { current: 1, pageSize: 10 }
    });
  }, []);

  const columns: ColumnsType<any> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
      sorter: true,
      key: 'createdAt'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (amount) => `$${Number(amount).toFixed(2)}`,
      sorter: true,
      key: 'amount'
    },
    {
      title: 'Type',
      dataIndex: 'type'
    },
    {
      title: 'Description',
      dataIndex: 'description'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          danger 
          onClick={() => handleDeleteTransaction(record.id)}
          disabled={wallet?.status !== 'FROZEN'}
          title={wallet?.status !== 'FROZEN' ? 'Wallet must be frozen to delete transactions' : ''}
        >
          Delete
        </Button>
      ),
    }
  ];

  return (
    <Container>
      <Header>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/wallet')}
          >
            Back
          </Button>
          <Button type="primary" onClick={exportCSV}>
            Export CSV
          </Button>
          <Button 
            danger 
            onClick={handleDeleteAll}
            disabled={wallet?.status !== 'FROZEN'}
            title={wallet?.status !== 'FROZEN' ? 'Wallet must be frozen to delete transactions' : ''}
          >
            Delete All Transactions
          </Button>
        </Space>
      </Header>
      
      {wallet?.status !== 'FROZEN' && (
        <Alert
          message="Note: Transactions can only be deleted when the wallet is frozen"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
      />
    </Container>
  );
};

export default TransactionsPage; 