import { useCallback, useRef } from 'react';

type RiskLevel = 'high' | 'medium' | 'safe';

const riskMessages: Record<RiskLevel, string[]> = {
  high: [
    'Warning! You are entering a high risk accident zone. Please reduce your speed and stay alert.',
    'Caution! High accident risk area ahead. Drive carefully.',
    'Alert! This is a dangerous zone with frequent accidents. Proceed with extreme caution.',
  ],
  medium: [
    'Attention! You are entering a medium risk area. Please be cautious.',
    'Notice: Moderate accident risk in this zone. Stay alert.',
    'Advisory: This area has moderate accident history. Drive carefully.',
  ],
  safe: [
    'You are now in a safe zone. Normal driving conditions apply.',
    'This is a low risk area. Continue driving safely.',
    'Safe zone entered. Road conditions are favorable.',
  ],
};

export const useVoiceAlert = () => {
  const lastAlertRef = useRef<{ level: RiskLevel; time: number } | null>(null);
  const speakingRef = useRef(false);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window && !speakingRef.current) {
      speakingRef.current = true;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to use a female voice for better clarity
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) 
        || voices.find(v => v.lang.includes('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        speakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const alertRiskLevel = useCallback((level: RiskLevel) => {
    const now = Date.now();
    
    // Don't repeat the same alert within 10 seconds
    if (lastAlertRef.current && 
        lastAlertRef.current.level === level && 
        now - lastAlertRef.current.time < 10000) {
      return;
    }

    const messages = riskMessages[level];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    speak(message);
    lastAlertRef.current = { level, time: now };
  }, [speak]);

  const customAlert = useCallback((message: string) => {
    speak(message);
  }, [speak]);

  return { alertRiskLevel, customAlert };
};
