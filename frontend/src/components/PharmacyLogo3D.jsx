import React from 'react';
import { cn } from './UI';

const SIZES = {
  sm: 52,
  md: 88,
  lg: 148,
  xl: 220,
};

/**
 * Logo pharmacie 3D : croix + capsule, rotation continue sur l'axe Y.
 */
const PharmacyLogo3D = ({ size = 'md', className, showGlow = true }) => {
  const px = SIZES[size] || SIZES.md;

  return (
    <div
      className={cn('logo-3d-container', className)}
      style={{ '--logo-size': `${px}px` }}
      aria-hidden="true"
    >
      {showGlow && <div className="logo-3d-glow" />}
      <div className="logo-3d-scene">
        <div className="logo-3d-spinner">
          {/* Anneau orbital */}
          <div className="logo-3d-ring" />

          {/* Capsule — moitié basse */}
          <div className="logo-3d-capsule logo-3d-capsule-bottom">
            <div className="logo-3d-capsule-shine" />
          </div>

          {/* Capsule — moitié haute */}
          <div className="logo-3d-capsule logo-3d-capsule-top">
            <div className="logo-3d-capsule-shine" />
          </div>

          {/* Croix pharmacie */}
          <div className="logo-3d-cross logo-3d-cross-v" />
          <div className="logo-3d-cross logo-3d-cross-h" />

          {/* Faces latérales pour effet 3D */}
          <div className="logo-3d-face logo-3d-face-left" />
          <div className="logo-3d-face logo-3d-face-right" />
        </div>
      </div>
    </div>
  );
};

export default PharmacyLogo3D;
