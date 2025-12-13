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
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);
  
  return (
    <Routes>
      <Route path="/*" element={<Home />} />
    </Routes>
  );
}

export default App;
