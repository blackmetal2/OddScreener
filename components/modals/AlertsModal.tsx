'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Alert {
  id: string;
  marketName: string;
  condition: 'above' | 'below';
  threshold: number;
  createdAt: Date;
}

export default function AlertsModal({ isOpen, onClose }: AlertsModalProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load alerts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('oddscreener-alerts');
    if (saved) {
      setAlerts(JSON.parse(saved));
    }
  }, []);

  // Save alerts to localStorage
  const saveAlerts = (newAlerts: Alert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('oddscreener-alerts', JSON.stringify(newAlerts));
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter((a) => a.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Price Alerts</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {alerts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <p className="text-text-primary font-medium mb-1">No alerts yet</p>
              <p className="text-text-muted text-sm">
                Set alerts from any market detail page to get notified when prices change.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium truncate">
                      {alert.marketName}
                    </p>
                    <p className="text-text-muted text-sm">
                      {alert.condition === 'above' ? 'Above' : 'Below'} {alert.threshold}%
                    </p>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="p-1 text-text-muted hover:text-negative transition-colors ml-2"
                    title="Remove alert"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            Alerts are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
