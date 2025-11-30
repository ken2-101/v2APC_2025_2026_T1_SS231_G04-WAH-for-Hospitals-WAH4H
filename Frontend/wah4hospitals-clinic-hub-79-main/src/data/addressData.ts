export const regions = [
    { code: 'NCR', name: 'National Capital Region' },
    { code: 'R3', name: 'Region III (Central Luzon)' },
    { code: 'R4A', name: 'Region IV-A (CALABARZON)' },
];

export const provinces: Record<string, { code: string; name: string }[]> = {
    'NCR': [
        { code: 'MM', name: 'Metro Manila' } // Not technically a province but treated as such for hierarchy
    ],
    'R3': [
        { code: 'BUL', name: 'Bulacan' },
        { code: 'PAM', name: 'Pampanga' },
    ],
    'R4A': [
        { code: 'CAV', name: 'Cavite' },
        { code: 'LAG', name: 'Laguna' },
    ]
};

export const cities: Record<string, { code: string; name: string }[]> = {
    'MM': [
        { code: 'MNL', name: 'Manila' },
        { code: 'QC', name: 'Quezon City' },
        { code: 'MK', name: 'Makati' },
    ],
    'BUL': [
        { code: 'MAL', name: 'Malolos' },
        { code: 'MEY', name: 'Meycauayan' },
    ],
    'PAM': [
        { code: 'SF', name: 'San Fernando' },
        { code: 'ANG', name: 'Angeles' },
    ],
    'CAV': [
        { code: 'BAC', name: 'Bacoor' },
        { code: 'DAS', name: 'Dasmarinas' },
    ],
    'LAG': [
        { code: 'CAL', name: 'Calamba' },
        { code: 'STA', name: 'Santa Rosa' },
    ]
};

export const barangays: Record<string, string[]> = {
    'MNL': ['Barangay 1', 'Barangay 2', 'Barangay 3'],
    'QC': ['Batasan Hills', 'Commonwealth', 'Holy Spirit'],
    'MK': ['Bel-Air', 'Poblacion', 'San Lorenzo'],
    'MAL': ['Catmon', 'Liang', 'Mojon'],
    'MEY': ['Bancal', 'Hulo', 'Saluysoy'],
    'SF': ['Dolores', 'San Agustin', 'San Jose'],
    'ANG': ['Balibago', 'Cutcut', 'Pulung Maragul'],
    'BAC': ['Molino I', 'Molino II', 'Panapaan'],
    'DAS': ['Salawag', 'Paliparan', 'Sampaloc'],
    'CAL': ['Bucal', 'Canlubang', 'Real'],
    'STA': ['Balibago', 'Don Jose', 'Malitlit'],
};
