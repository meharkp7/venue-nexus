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
    <div className="landing-page">
      {/* Animated Background */}
      <div className="background-animation">
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
          <div className="hero-kicker">Premium Operations Intelligence</div>
          <h1 className="hero-title">
            <span className="title-gradient">VenueNexus</span>
            <br />
            <span className="title-subtitle">Black Gold Command Surface</span>
          </h1>
          
          <p className="hero-description">
            A cinematic control layer for live venue operations with predictive crowd intelligence,
            fast intervention controls, and ambient situational awareness.
          </p>

          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <span>AI-Powered Analytics</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <span>Real-Time Insights</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Lightning Fast</span>
            </div>
          </div>

          <button className="cta-button" onClick={handleStartDemo}>
            <span className="button-text">Start Experience</span>
            <div className="button-glow"></div>
            <div className="button-particles"></div>
          </button>
        </div>

        <div className="hero-visual">
          <div className="floating-card">
            <div className="card-header">
              <div className="card-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="card-title">Live Analytics</div>
            </div>
            <div className="card-content">
              <div className="metric">
                <div className="metric-value">2,847</div>
                <div className="metric-label">Audience In Flow</div>
              </div>
              <div className="metric">
                <div className="metric-value">94%</div>
                <div className="metric-label">Signal Confidence</div>
              </div>
              <div className="metric">
                <div className="metric-value">0.3s</div>
                <div className="metric-label">Response Latency</div>
              </div>
            </div>
            <div className="card-grid" />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        <div className="tech-stack">
          <div className="tech-item">React</div>
          <div className="tech-item">FastAPI</div>
          <div className="tech-item">Vertex AI</div>
          <div className="tech-item">Real-Time</div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
