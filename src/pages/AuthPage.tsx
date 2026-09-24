import React from 'react';
import { motion } from 'framer-motion';
import { AuthForm } from '@/components/AuthForm';
import { Settings, Shield, Radio, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroRoad from '@/assets/hero-road.jpg';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroRoad})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl gradient-text">RoadGuard</h1>
            <p className="text-xs text-muted-foreground">AI Safety System</p>
          </div>
        </motion.div>
        
        <Link to="/settings">
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl glass-button"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">AI-Powered</span>
            <br />
            Road Safety System
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Real-time accident prediction and prevention with voice alerts for safer journeys
          </p>
        </motion.div>

        <AuthForm />

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-3 gap-6 max-w-lg"
        >
          {[
            { icon: Radio, label: 'Voice Alerts' },
            { icon: MapPin, label: 'Risk Zones' },
            { icon: Shield, label: 'AI Protection' },
          ].map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center mb-2">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default AuthPage;
