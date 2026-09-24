import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Volume2, Moon, Shield, Info, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);

  const settingsSections = [
    {
      title: 'Alerts & Notifications',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          description: 'Get notified about risk zones',
          value: notifications,
          onChange: setNotifications,
        },
        {
          icon: Volume2,
          label: 'Voice Alerts',
          description: 'Audio warnings for risk zones',
          value: voiceAlerts,
          onChange: setVoiceAlerts,
        },
      ],
    },
    {
      title: 'Navigation',
      items: [
        {
          icon: Shield,
          label: 'Auto Risk Detection',
          description: 'Automatically detect and alert risk zones',
          value: autoDetect,
          onChange: setAutoDetect,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Better for night driving',
          value: darkMode,
          onChange: setDarkMode,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20" />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl glass-button"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="font-display text-2xl font-bold gradient-text">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 px-6 pb-6 space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {section.title}
            </h2>
            <div className="glass-panel divide-y divide-border">
              {section.items.map((item, itemIndex) => (
                <div
                  key={item.label}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={item.value}
                    onCheckedChange={item.onChange}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* About section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            About
          </h2>
          <div className="glass-panel">
            <button className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">About RoadGuard AI</p>
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4 bg-primary/10 border-primary/30"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">AI-Powered Safety</p>
              <p className="text-sm text-muted-foreground">
                RoadGuard uses machine learning to predict accident-prone zones and provide real-time voice alerts to keep you safe on the road.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SettingsPage;
