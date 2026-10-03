export interface StateDistrictMapping {
  state: string;
  districts: string[];
  coordinates: [number, number]; // center [lat, lng]
  defaultZoom: number;
}

export const STATE_DISTRICTS: StateDistrictMapping[] = [
  {
    state: 'Karnataka',
    coordinates: [14.5, 75.8],
    defaultZoom: 7,
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Tumakuru',
      'Belagavi',
      'Ballari',
      'Vijayapura',
      'Mysuru',
      'Shivamogga',
      'Dakshina Kannada',
      'Kalaburagi',
      'Dharwad',
      'Mandya',
      'Hassan',
      'Udupi'
    ]
  },
  {
    state: 'Maharashtra',
    coordinates: [19.75, 75.71],
    defaultZoom: 7,
    districts: [
      'Pune',
      'Nagpur',
      'Thane',
      'Nashik',
      'Chhatrapati Sambhajinagar',
      'Raigad',
      'Solapur',
      'Kolhapur',
      'Amravati'
    ]
  },
  {
    state: 'Tamil Nadu',
    coordinates: [11.12, 78.65],
    defaultZoom: 7,
    districts: [
      'Chennai',
      'Coimbatore',
      'Kanchipuram',
      'Madurai',
      'Salem',
      'Tiruchirappalli',
      'Tiruvallur',
      'Vellore'
    ]
  },
  {
    state: 'Gujarat',
    coordinates: [22.25, 71.19],
    defaultZoom: 7,
    districts: [
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Bharuch',
      'Kutch',
      'Bhavnagar',
      'Gandhinagar'
    ]
  },
  {
    state: 'Telangana',
    coordinates: [17.85, 79.1],
    defaultZoom: 7,
    districts: [
      'Hyderabad',
      'Rangareddy',
      'Medak',
      'Warangal',
      'Nalgonda',
      'Karimnagar',
      'Khammam'
    ]
  }
];

export const ALL_STATES = STATE_DISTRICTS.map((s) => s.state);

export function getDistrictsForState(stateName: string): string[] {
  if (!stateName || stateName === 'All' || stateName === 'All States') {
    // Return all unique districts sorted
    const all = STATE_DISTRICTS.flatMap((s) => s.districts);
    return Array.from(new Set(all)).sort();
  }
  const match = STATE_DISTRICTS.find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  return match ? match.districts.sort() : [];
}

export function getStateCoordinates(stateName: string): [number, number] | null {
  const match = STATE_DISTRICTS.find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  return match ? match.coordinates : null;
}
