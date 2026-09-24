export interface RiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  level: 'high' | 'medium' | 'safe';
  description: string;
  accidentCount?: number;
}

// Coimbatore city center coordinates: 11.0168, 76.9558
// Risk zones specifically for Coimbatore, Tamil Nadu
export const riskZones: RiskZone[] = [
  // High Risk Zones (Red) - Major junctions and accident-prone areas in Coimbatore
  { id: 'h1', lat: 11.0168, lng: 76.9558, radius: 400, level: 'high', description: 'Gandhipuram Bus Stand - Heavy Traffic Junction', accidentCount: 48 },
  { id: 'h2', lat: 11.0014, lng: 76.9620, radius: 350, level: 'high', description: 'RS Puram - Busy Commercial Area', accidentCount: 42 },
  { id: 'h3', lat: 11.0453, lng: 76.9380, radius: 450, level: 'high', description: 'Ukkadam - Main Bus Terminal Junction', accidentCount: 55 },
  { id: 'h4', lat: 11.0569, lng: 76.9852, radius: 380, level: 'high', description: 'Avinashi Road - Tidel Park Junction', accidentCount: 38 },
  { id: 'h5', lat: 11.0236, lng: 76.9225, radius: 400, level: 'high', description: 'Singanallur - Railway Station Road', accidentCount: 44 },
  { id: 'h6', lat: 10.9925, lng: 76.9612, radius: 350, level: 'high', description: 'Race Course - High Speed Zone', accidentCount: 36 },
  
  // Medium Risk Zones (Yellow) - Moderately busy areas
  { id: 'm1', lat: 11.0285, lng: 76.9548, radius: 300, level: 'medium', description: 'Town Hall - Commercial District', accidentCount: 22 },
  { id: 'm2', lat: 11.0120, lng: 76.9885, radius: 320, level: 'medium', description: 'Peelamedu - IT Corridor Junction', accidentCount: 19 },
  { id: 'm3', lat: 11.0385, lng: 76.9125, radius: 280, level: 'medium', description: 'Saibaba Colony - Residential Junction', accidentCount: 16 },
  { id: 'm4', lat: 10.9785, lng: 76.9445, radius: 300, level: 'medium', description: 'Ramanathapuram - Hospital Zone', accidentCount: 20 },
  { id: 'm5', lat: 11.0655, lng: 76.9695, radius: 290, level: 'medium', description: 'Hopes College Junction', accidentCount: 18 },
  { id: 'm6', lat: 11.0089, lng: 76.9325, radius: 310, level: 'medium', description: 'Kuniyamuthur - Bridge Area', accidentCount: 21 },
  { id: 'm7', lat: 11.0425, lng: 76.9785, radius: 280, level: 'medium', description: 'Vadavalli - Palghat Road Junction', accidentCount: 17 },
  
  // Safe Zones (Green) - Well-managed traffic areas
  { id: 's1', lat: 11.0245, lng: 76.9668, radius: 350, level: 'safe', description: 'Coimbatore Medical College Area', accidentCount: 4 },
  { id: 's2', lat: 11.0485, lng: 76.9158, radius: 320, level: 'safe', description: 'VOC Park - Low Traffic Zone', accidentCount: 3 },
  { id: 's3', lat: 10.9568, lng: 76.9425, radius: 380, level: 'safe', description: 'PSG Tech Campus Area', accidentCount: 2 },
  { id: 's4', lat: 11.0325, lng: 77.0125, radius: 300, level: 'safe', description: 'Kovai Pudur - Residential Area', accidentCount: 5 },
  { id: 's5', lat: 11.0712, lng: 76.9425, radius: 340, level: 'safe', description: 'GCT - Educational Zone', accidentCount: 3 },
  { id: 's6', lat: 10.9685, lng: 76.9785, radius: 300, level: 'safe', description: 'Podanur - Well-Signaled Area', accidentCount: 4 },
];

// Coimbatore city bounds for map centering
export const coimbatoreBounds = {
  center: { lat: 11.0168, lng: 76.9558 },
  north: 11.1,
  south: 10.9,
  east: 77.05,
  west: 76.88,
};

export const getRiskColor = (level: 'high' | 'medium' | 'safe'): string => {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#eab308';
    case 'safe': return '#22c55e';
    default: return '#6b7280';
  }
};

export const getRiskOpacity = (level: 'high' | 'medium' | 'safe'): number => {
  switch (level) {
    case 'high': return 0.4;
    case 'medium': return 0.35;
    case 'safe': return 0.3;
    default: return 0.25;
  }
};
