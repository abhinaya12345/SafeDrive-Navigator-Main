import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Shield } from 'lucide-react';

interface RiskToggleProps {
  activeFilters: {
    high: boolean;
    medium: boolean;
    safe: boolean;
  };
  onToggle: (level: 'high' | 'medium' | 'safe') => void;
}

export const RiskToggle: React.FC<RiskToggleProps> = ({ activeFilters, onToggle }) => {
  const toggleItems = [
    {
      level: 'high' as const,
      label: 'High Risk',
      icon: AlertTriangle,
      dotClass: 'risk-dot-high',
      activeClass: 'ring-risk-high bg-risk-high/20',
    },
    {
      level: 'medium' as const,
      label: 'Medium Risk',
      icon: AlertCircle,
      dotClass: 'risk-dot-medium',
      activeClass: 'ring-risk-medium bg-risk-medium/20',
    },
    {
      level: 'safe' as const,
      label: 'Safe Zone',
      icon: Shield,
      dotClass: 'risk-dot-safe',
      activeClass: 'ring-risk-safe bg-risk-safe/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-3 space-y-2"
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-2">
        Risk Zones
      </p>
      {toggleItems.map((item) => (
        <motion.button
          key={item.level}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onToggle(item.level)}
          className={`toggle-button w-full justify-start ${
            activeFilters[item.level]
              ? `${item.activeClass} ring-2 ring-offset-2 ring-offset-background`
              : 'bg-secondary/50 hover:bg-secondary'
          }`}
        >
          <div className={`risk-dot ${item.dotClass}`} />
          <span className="text-sm font-medium">{item.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
