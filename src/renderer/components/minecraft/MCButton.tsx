/**
 * MCButton - Minecraft-style button component
 * Adapts to the current biome theme automatically
 */

import React from 'react';
import './MCButton.css';

export interface MCButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const MCButton: React.FC<MCButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      // Play click sound (optional)
      // new Audio('/sounds/click.ogg').play();
      onClick();
    }
  };

  return (
    <button
      type={type}
      className={`
        mc-button
        mc-button--${variant}
        mc-button--${size}
        ${fullWidth ? 'mc-button--full-width' : ''}
        ${disabled ? 'mc-button--disabled' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      disabled={disabled}
    >
      {/* Top highlight (светлая грань) */}
      <span className="mc-button__highlight" aria-hidden="true"></span>

      {/* Texture overlay */}
      <span className="mc-button__texture" aria-hidden="true"></span>

      {/* Content */}
      <span className="mc-button__content">{children}</span>

      {/* Bottom shadow (темная грань) */}
      <span className="mc-button__shadow" aria-hidden="true"></span>
    </button>
  );
};

export default MCButton;
