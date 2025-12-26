import { useState, useEffect } from 'react';
import { fetchGalleryPhotos } from '../services/api';
import '../styles/modern.css';
import '../styles/gallery.css';

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const loadPhotos = async () => {
      setLoading(true);
      try {
        const data = await fetchGalleryPhotos({ sortBy: 'created_at', order: 'desc' });
        setPhotos(Array.isArray(data) ? data : []);
      } catch {
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowLoader(false);
      return;
    }
    // Only show loader after 2.5 seconds - prevents distracting flash for fast loads
    const t = setTimeout(() => setShowLoader(true), 2500);
    return () => clearTimeout(t);
  }, [loading]);

  const openLightbox = (photo) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gallery</h1>
          <p className="page-meta">Photography and visual moments.</p>
        </div>
      </div>

      {loading && showLoader ? (
        <div className="loading-container">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="loading-text">loading gallery...</p>
        </div>
      ) : !loading ? (
        photos.length === 0 ? (
        <div className="gallery-empty">
          <p>Gallery coming soon. Photos will appear here.</p>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {photos.map((photo, index) => (
              <div
                key={photo.id || index}
                className="gallery-item"
                onClick={() => openLightbox(photo)}
              >
                <img
                  src={photo.image_url || photo.url || photo.src}
                  alt={photo.title || photo.caption || 'Gallery photo'}
                  loading="lazy"
                />
                {(photo.title || photo.caption) && (
                  <div className="gallery-item-caption">{photo.title || photo.caption}</div>
                )}
              </div>
            ))}
          </div>

          {selectedPhoto && (
            <div className="gallery-lightbox-overlay" onClick={closeLightbox}>
              <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
                <button className="gallery-lightbox-close" onClick={closeLightbox} aria-label="Close">
                  ×
                </button>
                <img
                  src={selectedPhoto.image_url || selectedPhoto.url || selectedPhoto.src}
                  alt={selectedPhoto.title || selectedPhoto.caption || 'Gallery photo'}
                />
                {(selectedPhoto.title || selectedPhoto.caption) && (
                  <div className="gallery-lightbox-caption">
                    {selectedPhoto.title && <h3>{selectedPhoto.title}</h3>}
                    {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
        )
      ) : null}
    </>
  );
}

