import { useState, useEffect } from 'react';

import { Github, ExternalLink, Code2, Terminal, Cpu } from 'lucide-react';

export default function LabPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Placeholder for future API integration
  useEffect(() => {
    // TODO: Fetch projects from backend or GitHub API
    // Adding some dummy data for visualization
    setProjects([
      {
        title: "Zeros & Ones",
        description: "This very website. A personal digital garden built with React, Vite, and Node.js. Features a custom blog engine, library tracker, and modern UI.",
        tech: ["React", "Node.js", "Vite", "MongoDB"],
        url: "https://github.com/karthi209/zerosandones",
        status: "Active"
      }
    ]);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div 
        className="post hero-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="post-section-title">Projects</h2>
        <p className="post-content">
          My tech playground - experimental projects, creative code, side projects, 
          and anything I'm currently building. Some work in progress, some shipped, 
          all worth exploring.
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading games...</p>
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="blog-card-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Code2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>
            No projects listed yet. Check back soon or visit my{' '}
            <a 
              href="https://github.com/karthi209" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
            >
              GitHub
            </a>{' '}
            for now.
          </p>
        </div>
      ) : (
        <div 
          className="blog-cards-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {projects.map((project, index) => (
            <div 
              key={index} 
              className="blog-card"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="blog-card-header">
                <div className="blog-card-icon">
                  <Terminal size={24} color="var(--color-accent)" />
                </div>
                {project.status && (
                  <span className="status-indicator" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                    <span className="status-dot"></span>
                    {project.status}
                  </span>
                )}
              </div>
              
              <h3 className="blog-card-title">{project.title}</h3>
              
              <div className="blog-card-meta" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                {project.tech && project.tech.map(t => (
                  <span key={t} style={{ 
                    background: 'var(--color-surface-hover)', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-light)'
                  }}>
                    {t}
                  </span>
                ))}
              </div>
              
              <p className="blog-card-excerpt">
                {project.description}
              </p>
              
              <div className="blog-card-footer">
                {project.url && (
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="blog-card-link"
                  >
                    View Project <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
