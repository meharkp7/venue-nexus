import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [shapes] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${90 + Math.random() * 180}px`,
      delay: `${Math.random() * 6}s`,
      duration: `${16 + Math.random() * 10}s`,
    }))
  );

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleStartDemo = () => {
    navigate('/dashboard');
  };

  return (
    <div className="landing-page" role="main" id="main-content">
      {/* Animated Background — hidden from screen readers */}
      <div className="background-animation" aria-hidden="true">
        <div className="mesh-overlay" />
        <div className="noise-overlay" />
        <div className="floating-shapes">
          {shapes.map((shape) => (
            <div
              key={shape.id}
              className="shape"
              style={{
                left: shape.left,
                top: shape.top,
                width: shape.size,
                height: shape.size,
                animationDelay: shape.delay,
                animationDuration: shape.duration
              }}
            />
          ))}
        </div>
        <div
          className="gradient-orb"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div
          className="scan-beam"
          style={{
            transform: `translateX(${mousePosition.x * 0.01}px) rotate(-12deg)`
          }}
        />
      </div>

      {/* Hero Content */}
      <div className={`hero-content ${isLoaded ? 'loaded' : ''}`}>
        <div className="hero-text">
          <p className="hero-kicker" aria-label="Product category: Premium Operations Intelligence">Premium Operations Intelligence</p>
          <h1 className="hero-title">
            <span className="title-gradient">VenueNexus</span>
            <br />
            <span className="title-subtitle">Black Gold Command Surface</span>
          </h1>

          <p className="hero-description">
            A cinematic control layer for live venue operations with predictive crowd intelligence,
            fast intervention controls, and ambient situational awareness.
          </p>

          <ul className="hero-features" role="list" aria-label="Key features" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li className="feature-item" role="listitem">
              <div className="feature-icon" aria-hidden="true">🧠</div>
              <span>AI-Powered Analytics</span>
            </li>
            <li className="feature-item" role="listitem">
              <div className="feature-icon" aria-hidden="true">📊</div>
              <span>Real-Time Insights</span>
            </li>
            <li className="feature-item" role="listitem">
              <div className="feature-icon" aria-hidden="true">⚡</div>
              <span>Lightning Fast</span>
            </li>
          </ul>

          <button
            className="cta-button"
            onClick={handleStartDemo}
            aria-label="Start the VenueNexus dashboard experience"
            type="button"
          >
            <span className="button-text">Start Experience</span>
            <div className="button-glow" aria-hidden="true"></div>
            <div className="button-particles" aria-hidden="true"></div>
          </button>
        </div>

        {/* Live analytics preview card */}
        <div className="hero-visual" aria-label="Live analytics preview" role="img">
          <div className="floating-card" role="presentation">
            <div className="card-header" aria-hidden="true">
              <div className="card-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="card-title">Live Analytics</div>
            </div>
            <div className="card-content" role="list" aria-label="Sample venue metrics">
              <div className="metric" role="listitem">
                <div className="metric-value" aria-label="2847 audience members in flow">2,847</div>
                <div className="metric-label">Audience In Flow</div>
              </div>
              <div className="metric" role="listitem">
                <div className="metric-value" aria-label="94 percent signal confidence">94%</div>
                <div className="metric-label">Signal Confidence</div>
              </div>
              <div className="metric" role="listitem">
                <div className="metric-value" aria-label="0.3 second response latency">0.3s</div>
                <div className="metric-label">Response Latency</div>
              </div>
            </div>
            <div className="card-grid" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <footer className="bottom-section">
        <nav className="tech-stack" aria-label="Technology stack">
          <span className="tech-item">React</span>
          <span className="tech-item">FastAPI</span>
          <span className="tech-item">Vertex AI</span>
          <span className="tech-item">Real-Time</span>
        </nav>
      </footer>
    </div>
  );
};

export default LandingPage;