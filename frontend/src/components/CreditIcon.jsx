import React from 'react';
import creditIconSrc from './credit_icon.png';

export default function CreditIcon({ size = 18, style = {}, className = '' }) {
  return (
    <img 
      src={creditIconSrc} 
      alt="Credits" 
      width={size} 
      height={size} 
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', ...style }} 
    />
  );
}
