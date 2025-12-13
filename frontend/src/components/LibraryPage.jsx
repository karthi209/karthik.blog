import { useNavigate } from 'react-router-dom';

export default function LibraryPage() {
  const navigate = useNavigate();

  const libraries = [
    {
      id: 'music',
      name: 'Music',
      description: 'Playlists, albums, and songs that define my soundtrack',
      path: '/library/music',
      color: '#FF6B9D'
    },
    {
      id: 'games',
      name: 'Games',
      description: 'Games I have played, reviewed, and cannot stop thinking about',
      path: '/library/games',
      color: '#C3F584'
    },
    {
      id: 'screen',
      name: 'Screen',
      description: 'Movies and TV series worth watching',
      path: '/library/screen',
      color: '#5ECFFF'
    },
    {
      id: 'reads',
      name: 'Reads',
      description: 'Books that changed my perspective',
      path: '/library/reads',
      color: '#FEC46D'
    },
    {
      id: 'travels',
      name: 'Travels',
      description: 'Places visited, journeys taken, and adventures documented',
      path: '/library/travels',
      color: '#B19CD9'
    }
  ];

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
    <>
      <div 
        className="post hero-section"
      >
        <h2 className="page-title">Library</h2>
        <p className="page-meta">{libraries.length} COLLECTIONS · MUSIC · GAMES · SCREEN · READS · TRAVELS</p>
      </div>

      <div className="list-rows">
        {libraries.map((library) => (
          <div
            key={library.id}
            className="list-row library-item"
            onClick={() => navigate(library.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(library.path); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="library-color-indicator" style={{ background: library.color }}></div>
            <div>
              <div className="list-row-title">
                {library.name}
              </div>
              <div className="list-row-meta">
                <span className="meta-detail">COLLECTION</span>
                <span className="meta-item">{library.description}</span>
              </div>
            </div>
            <div className="list-row-right">
              <span className="pill">Explore</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
