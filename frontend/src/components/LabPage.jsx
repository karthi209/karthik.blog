import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function LabPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch(`${API}/projects`);
        if (!res.ok) throw new Error('Failed to load projects');
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-meta">Tech playground · experiments · side quests</p>
        </div>
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
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="blog-card-empty" style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--color-text-muted)'
        }}>
          <p>No projects listed yet.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Check my{' '}
            <a
              href="https://github.com/karthi209"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              GitHub
            </a>
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project, index) => (
            <article key={project.id || index} className="project-card">
              <h3 className="project-card-title">{project.title}</h3>


              <div className="project-card-meta">
                <span className="meta-tag">{(project.status || 'PROJECT').toUpperCase()}</span>
                {project.tech && (Array.isArray(project.tech) ? project.tech : project.tech.split(',')).slice(0, 4).map((t, i) => (
                  <span key={i} className="meta-detail">{String(t).trim().toUpperCase()}</span>
                ))}
              </div>

              {project.description ? (
                <div className="project-card-desc" dangerouslySetInnerHTML={{ __html: project.description }} />
              ) : null}

              <div className="project-card-actions">
                {project.url ? (
                  <a className="retro-button retro-button--sm" href={project.url} target="_blank" rel="noreferrer">
                    Open →
                  </a>
                ) : null}
                {project.github_url ? (
                  <a className="retro-button retro-button--sm" href={project.github_url} target="_blank" rel="noreferrer">
                    GitHub →
                  </a>
                ) : (
                  <a className="retro-button retro-button--sm" href="https://github.com/karthi209" target="_blank" rel="noreferrer">
                    GitHub →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
