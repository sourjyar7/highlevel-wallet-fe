import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WalletPage from './pages/WalletPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletListPage from './pages/WalletListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WalletListPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 