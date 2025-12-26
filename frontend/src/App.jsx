import React, { Suspense } from 'react';
import './styles/variables.css';
import './styles/typography.css';
import './styles/book.css';
import './styles/responsive.css';
import './styles/modern.css';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';

function App() {
  React.useEffect(() => {
    // Always use dark theme - minimalist, personal, artistic
    document.documentElement.setAttribute('data-theme', 'dark');
    // Clean up any old theme preferences
    try {
      localStorage.removeItem('theme');
    } catch {}
  }, []);
  
  return (
    <Routes>
      <Route path="/*" element={<Home />} />
    </Routes>
  );
}

export default App;
