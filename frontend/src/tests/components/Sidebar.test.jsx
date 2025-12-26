import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Sidebar', () => {
  it('should render sidebar with navigation links', () => {
    renderWithRouter(<Sidebar />);
    
    expect(screen.getByText('Blogs')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should render connect section', () => {
    renderWithRouter(<Sidebar />);
    
    expect(screen.getByText(/Connect/i)).toBeInTheDocument();
  });

  it('should have clickable navigation links', () => {
    renderWithRouter(<Sidebar />);
    const user = userEvent.setup();
    
    const blogsLink = screen.getByText('Blogs');
    expect(blogsLink.closest('a')).toHaveAttribute('href', '/blogs');
  });
});


