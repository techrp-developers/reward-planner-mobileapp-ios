import React from 'react';
import './CalculatorCard.css';

export interface CalculatorItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  screen: string;
}

interface Props {
  item: CalculatorItem;
  onPress: () => void;
}

const CalculatorCard: React.FC<Props> = ({ item, onPress }) => (
  <button className="calculator-card" onClick={onPress}>
    <div className="card-inner">
      <div className="top-row">
        <div className="image-halo">
          <img src={item.image} alt={item.title} />
        </div>
        <div className="quick-badge">
          <span style={{ color: '#7C3AED', fontSize: 10 }}>⚡</span>
          <span className="quick-badge-text">Tool</span>
        </div>
      </div>

      <p className="card-title">{item.title}</p>
      <p className="card-description">{item.subtitle}</p>

      <div className="calc-row">
        <span className="calc-text">Calculate Now</span>
        <div className="arrow-circle">→</div>
      </div>
    </div>
  </button>
);

export default CalculatorCard;

export const HeroSection: React.FC = () => (
  <div className="hero-shadow">
    <div className="hero-section">
      <h1 className="hero-title">Smart Investment{'\n'}Planner</h1>
      <p className="hero-subtitle">
        Calculate returns, learn the basics, and track your financial future.
      </p>
    </div>
  </div>
);
