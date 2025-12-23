import React, { Suspense } from 'react';
import './styles/variables.css';
import './styles/typography.css';
import './styles/book.css';
import './styles/responsive.css';
import './styles/modern.css';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';

function App() {
  React.useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem('theme');
      } catch {
        return null;
      }
    })();

    const current = document.documentElement.getAttribute('data-theme');
    const valid = (t) => t === 'dark' || t === 'light';
    const next = (valid(saved) && saved) || (valid(current) && current) || 'dark';

    document.documentElement.setAttribute('data-theme', next);
  }, []);
  
  return (
    <Routes>
      <Route path="/*" element={<Home />} />
    </Routes>
  );
}

export default App;
