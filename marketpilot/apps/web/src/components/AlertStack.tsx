import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { PlatformAlert } from '../types';

interface AlertStackProps {
  alerts: PlatformAlert[];
  onDismiss: (id: string) => void;
}

export function AlertStack({ alerts, onDismiss }: AlertStackProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Sort alerts so the latest created announcement is always on top (index 0)
  const sortedAlerts = useMemo(() => {
    if (!alerts) return [];
    return [...alerts].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [alerts]);

  if (!sortedAlerts || sortedAlerts.length === 0) return null;

  // Single alert: normal full banner
  if (sortedAlerts.length === 1) {
    const alert = sortedAlerts[0];
    return (
      <div className="alert-stack-wrapper single-alert">
        <div className={`platform-broadcast-banner alert-stack-card severity-${alert.severity}`}>
          <div className="banner-left">
            <span className="banner-badge">{alert.severity.toUpperCase()}</span>
            <strong>{alert.title}:</strong>
            <span className="banner-msg">{alert.message}</span>
          </div>
          <button
            type="button"
            className="banner-dismiss-btn"
            onClick={() => onDismiss(alert.id)}
            title="Dismiss announcement"
            aria-label="Dismiss announcement"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Multiple alerts: Layered opaque card stack, expands downwards on hover
  const CARD_HEIGHT = 44;
  const GAP = 8;
  const maxCollapsedPeek = Math.min(sortedAlerts.length - 1, 2);
  const collapsedHeight = CARD_HEIGHT + maxCollapsedPeek * 8;
  const expandedHeight = sortedAlerts.length * CARD_HEIGHT + (sortedAlerts.length - 1) * GAP;

  return (
    <div
      className={`alert-stack-wrapper multi-stack ${isHovered ? 'is-expanded' : 'is-collapsed'}`}
      style={{
        height: `${isHovered ? expandedHeight : collapsedHeight}px`,
        marginBottom: isHovered ? '24px' : '18px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {sortedAlerts.map((alert, index) => {
        let topPos = 0;
        let scale = 1;
        let filter = 'none';
        let zIndex = sortedAlerts.length - index;
        let opacity = 1;
        let pointerEvents: React.CSSProperties['pointerEvents'] = 'auto';

        if (!isHovered) {
          if (index === 0) {
            topPos = 0;
            scale = 1;
            filter = 'none';
            opacity = 1;
            zIndex = 10;
          } else if (index === 1) {
            topPos = 8;
            scale = 0.985;
            filter = 'brightness(0.85)';
            opacity = 1; // 100% opaque, no text bleed
            zIndex = 9;
            pointerEvents = 'none';
          } else if (index === 2) {
            topPos = 16;
            scale = 0.97;
            filter = 'brightness(0.7)';
            opacity = 1; // 100% opaque, no text bleed
            zIndex = 8;
            pointerEvents = 'none';
          } else {
            topPos = 16;
            scale = 0.955;
            filter = 'brightness(0.5)';
            opacity = 0;
            zIndex = 7;
            pointerEvents = 'none';
          }
        } else {
          // Expanded downwards on hover
          topPos = index * (CARD_HEIGHT + GAP);
          scale = 1;
          filter = 'none';
          opacity = 1;
          zIndex = 10;
          pointerEvents = 'auto';
        }

        return (
          <div
            key={alert.id}
            className={`platform-broadcast-banner alert-stack-card severity-${alert.severity}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${topPos}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              opacity,
              filter,
              zIndex,
              pointerEvents
            }}
          >
            <div className="banner-left">
              <span className="banner-badge">{alert.severity.toUpperCase()}</span>
              <strong>{alert.title}:</strong>
              <span className="banner-msg">{alert.message}</span>
            </div>
            <button
              type="button"
              className="banner-dismiss-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
              }}
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default AlertStack;
