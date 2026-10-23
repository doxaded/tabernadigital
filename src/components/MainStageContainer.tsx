import React from 'react';

interface MainStageContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const MainStageContainer: React.FC<MainStageContainerProps> = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`tavern-main-stage ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0',
        padding: '24px var(--edge, 32px) 80px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {children}
    </div>
  );
};
