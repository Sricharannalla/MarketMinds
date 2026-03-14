import React from 'react';
import PixelBlast from './pixelblast';

interface DashboardBackgroundProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  variant?: 'square' | 'circle' | 'triangle' | 'diamond';
  enableInteraction?: boolean;
}

const DashboardBackground: React.FC<DashboardBackgroundProps> = ({
  children,
  className = '',
  intensity = 0.06,
  variant = 'circle',
  enableInteraction = true
}) => {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Background PixelBlast */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant={variant}
          pixelSize={2}
          patternScale={1.5}
          patternDensity={0.7}
          liquid={true}
          liquidStrength={0.05}
          liquidRadius={0.8}
          pixelSizeJitter={0.2}
          enableRipples={enableInteraction}
          rippleIntensityScale={0.5}
          rippleThickness={0.05}
          rippleSpeed={0.2}
          liquidWobbleSpeed={3}
          speed={0.3}
          transparent={true}
          edgeFade={0.3}
          noiseAmount={0.02}
          intensity={intensity}
          className="pointer-events-none"
        />
      </div>

      {/* Content overlay with enhanced backdrop blur */}
      <div className="relative z-10 bg-background/96 backdrop-blur-md min-h-screen border border-background/20">
        {children}
      </div>
    </div>
  );
};

export default DashboardBackground;
