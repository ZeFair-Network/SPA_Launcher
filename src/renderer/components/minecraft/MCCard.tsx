/**
 * MCCard - Minecraft-style card component
 * Can be used as a regular card or inventory slot
 */

import React from 'react';
import './MCCard.css';

export interface MCCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'slot' | 'panel' | 'elevated';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  active?: boolean;
}

const MCCard: React.FC<MCCardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  onClick,
  className = '',
  padding = 'medium',
  active = false,
}) => {
  const handleClick = () => {
    if (onClick) {
      // Play click sound (optional)
      // new Audio('/sounds/click.ogg').play();
      onClick();
    }
  };

  return (
    <div
      className={`
        mc-card
        mc-card--${variant}
        mc-card--padding-${padding}
        ${hoverable ? 'mc-card--hoverable' : ''}
        ${active ? 'mc-card--active' : ''}
        ${onClick ? 'mc-card--clickable' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Corner borders (Minecraft UI style) */}
      <div className="mc-card__borders" aria-hidden="true">
        <span className="mc-card__corner mc-card__corner--tl"></span>
        <span className="mc-card__corner mc-card__corner--tr"></span>
        <span className="mc-card__corner mc-card__corner--bl"></span>
        <span className="mc-card__corner mc-card__corner--br"></span>
      </div>

      {/* Texture background */}
      <div className="mc-card__texture" aria-hidden="true"></div>

      {/* Content */}
      <div className="mc-card__content">
        {children}
      </div>
    </div>
  );
};

export default MCCard;
