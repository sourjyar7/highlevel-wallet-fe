import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Input, Button, Radio, Typography, Space, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Container = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 20px;
`;

interface Wallet {
  id: string;
  name: string;
  balance: string;
  status: string;
}

const WalletPage = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [isCredit, setIsCredit] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const walletId = localStorage.getItem('walletId');
    if (walletId && !showSetup) {
      fetchWallet(walletId);
    }
  }, [showSetup]);

  const fetchWallet = async (id: string) => {
    try {
      const response = await fetch(`/api/wallet/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Wallet not found');
      }
      
      setWallet(data);
    } catch (error) {
      message.error(error.message || 'Error fetching wallet');
      localStorage.removeItem('walletId');
      setWallet(null);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/wallet/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          balance: Number(balance) || 0,
          status: 'ACTIVE',
          metadata: {
            createdFrom: 'web'
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create wallet');
      }
      
      localStorage.setItem('walletId', data.id);
      message.success('Wallet created successfully');
      setShowSetup(false);
      setUsername('');
      setBalance('');
    } catch (error) {
      message.error(error.message || 'Error creating wallet');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    
    try {
      const response = await fetch(`/api/transact/${wallet.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: isCredit ? Number(amount) : -Number(amount),
          description: `${isCredit ? 'Credit' : 'Debit'} transaction`,
          referenceId: `TX_${Date.now()}`
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Transaction failed');
      }
      
      await fetchWallet(wallet.id);
      setAmount('');
      message.success('Transaction completed successfully');
    } catch (error) {
      message.error(error.message || 'Error processing transaction');
    }
  };

  const handleNewWallet = () => {
    localStorage.removeItem('walletId');
    setWallet(null);
    setShowSetup(true);
  };

  if (showSetup) {
    return (
      <Container>
        <StyledCard>
          <Title level={2}>Create New Wallet</Title>
          <form onSubmit={handleCreateWallet}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
              <Input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="Initial Balance (optional)"
                min="0"
                step="0.01"
              />
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setShowSetup(false)}
                >
                  Back
                </Button>
                <Button type="primary" htmlType="submit">
                  Create Wallet
                </Button>
              </Space>
            </Space>
          </form>
        </StyledCard>
      </Container>
    );
  }

  return (
    <Container>
      {!wallet ? (
        <StyledCard>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>Welcome to Wallet System</Title>
            <Button type="primary" onClick={handleNewWallet} block>
              Create New Wallet
            </Button>
          </Space>
        </StyledCard>
      ) : (
        <>
          <StyledCard>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/')}
                >
                  Back
                </Button>
                <Title level={2}>Wallet Details</Title>
              </Space>
              <p>Name: {wallet.name}</p>
              <p>Balance: ${Number(wallet.balance).toFixed(2)}</p>
              <Space>
                <Button onClick={() => navigate('/transactions')}>
                  View Transactions
                </Button>
              </Space>
            </Space>
          </StyledCard>

          <StyledCard>
            <Title level={3}>New Transaction</Title>
            <form onSubmit={handleTransaction}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                  required
                />
                <Radio.Group
                  value={isCredit}
                  onChange={(e) => setIsCredit(e.target.value)}
                >
                  <Radio value={true}>Credit</Radio>
                  <Radio value={false}>Debit</Radio>
                </Radio.Group>
                <Button type="primary" htmlType="submit" block>
                  Submit Transaction
                </Button>
              </Space>
            </form>
          </StyledCard>
        </>
      )}
    </Container>
  );
};

export default WalletPage; 