import type { OpsSnapshot, SupportedLanguage, VenueProfile } from './api-types.js';

export type { VenueProfile } from './api-types.js';

const FALLBACK_VENUE: VenueProfile = {
  name: 'Estadio Azteca',
  city: 'Mexico City',
  tournament: 'FIFA World Cup 2026',
  capacity: 83264,
  gates: [
    {
      id: 'gate-1',
      name: 'Gate 1 — North',
      serves: 'North Stand, sections 101–128',
      accessible: true,
    },
    {
      id: 'gate-2',
      name: 'Gate 2 — Northeast',
      serves: 'East Stand upper, sections 201–224',
      accessible: false,
    },
    {
      id: 'gate-3',
      name: 'Gate 3 — East',
      serves: 'East Stand lower, sections 129–148',
      accessible: true,
    },
    {
      id: 'gate-4',
      name: 'Gate 4 — South',
      serves: 'South Stand, sections 149–176',
      accessible: true,
    },
    {
      id: 'gate-5',
      name: 'Gate 5 — Southwest',
      serves: 'West Stand upper, sections 225–248',
      accessible: false,
    },
    {
      id: 'gate-6',
      name: 'Gate 6 — West (VIP & accessibility priority)',
      serves: 'West Stand lower, hospitality, accessible seating',
      accessible: true,
    },
  ],
  facilities: [
    {
      id: 'food-north',
      name: 'North Concourse Food Court',
      category: 'food',
      location: 'Level 1, behind sections 110–118',
      accessible: true,
      details: 'Tacos, tortas, vegetarian and halal options; card and cash.',
    },
    {
      id: 'food-south',
      name: 'South Concourse Food Court',
      category: 'food',
      location: 'Level 1, behind sections 156–164',
      accessible: true,
      details: 'Local street-food stalls and family combos.',
    },
    {
      id: 'water-refill',
      name: 'Free Water Refill Stations',
      category: 'sustainability',
      location: 'Every concourse, next to each food court',
      accessible: true,
      details: 'Bring a reusable bottle — refills are free and cut single-use plastic.',
    },
    {
      id: 'recycling-points',
      name: 'Recycling & Compost Points',
      category: 'sustainability',
      location: 'All concourse exits',
      accessible: true,
      details: 'Three-stream bins: recycling, compost, landfill.',
    },
    {
      id: 'first-aid-east',
      name: 'First Aid — East',
      category: 'medical',
      location: 'Level 1, next to Gate 3',
      accessible: true,
      details: 'Staffed by paramedics for the full event window.',
    },
    {
      id: 'first-aid-west',
      name: 'First Aid — West',
      category: 'medical',
      location: 'Level 1, next to Gate 6',
      accessible: true,
      details: 'Includes a quiet recovery room.',
    },
    {
      id: 'accessible-seating',
      name: 'Accessible Seating Platforms',
      category: 'accessibility',
      location: 'West Stand lower, via Gate 6',
      accessible: true,
      details: 'Wheelchair platforms with companion seats; book through Guest Services.',
    },
    {
      id: 'elevators-west',
      name: 'Elevators & Step-Free Route',
      category: 'accessibility',
      location: 'Gates 1, 3, 4 and 6',
      accessible: true,
      details: 'Step-free route runs the full concourse loop; elevators at each corner.',
    },
    {
      id: 'sensory-room',
      name: 'Sensory Room',
      category: 'accessibility',
      location: 'Level 2, West Stand near section 230',
      accessible: true,
      details: 'Low-stimulation space with trained staff; ear defenders available.',
    },
    {
      id: 'prayer-room',
      name: 'Multi-Faith Prayer Room',
      category: 'prayer',
      location: 'Level 2, North Stand near section 205',
      accessible: true,
      details:
        'Open from gates-open to one hour after the final whistle; ablution facilities adjacent.',
    },
    {
      id: 'family-room',
      name: 'Family & Baby Care Room',
      category: 'family',
      location: 'Level 1, South Stand near section 160',
      accessible: true,
      details: 'Nursing space, changing tables, bottle warming.',
    },
    {
      id: 'guest-services',
      name: 'Guest Services Desks',
      category: 'services',
      location: 'Inside Gates 1, 4 and 6',
      accessible: true,
      details: 'Lost & found, accessibility bookings, volunteer support, lost-child point.',
    },
  ],
  transit: [
    {
      id: 'metro',
      mode: 'metro',
      name: 'Tren Ligero — Estadio Azteca station',
      guidance:
        'Light rail from Tasqueña metro; trains every 5 minutes until 2 hours after the match. Step-free access at the stadium station.',
      accessible: true,
    },
    {
      id: 'shuttle',
      mode: 'shuttle',
      name: 'FIFA Fan Shuttle',
      guidance:
        'Free shuttles loop between the stadium, Zócalo fan festival and major hotel zones; board at the South Plaza.',
      accessible: true,
    },
    {
      id: 'bus',
      mode: 'bus',
      name: 'City bus corridors',
      guidance:
        'Routes on Calzada de Tlalpan stop 400 m from the North gates; expect diversions for 90 minutes post-match.',
      accessible: false,
    },
    {
      id: 'parking',
      mode: 'parking',
      name: 'Official parking (pre-booked only)',
      guidance:
        'Lots E and S require a pre-booked permit; accessible bays are beside Gate 6 with a drop-off lane.',
      accessible: true,
    },
    {
      id: 'rideshare',
      mode: 'rideshare',
      name: 'Rideshare pick-up zone',
      guidance:
        'Designated pick-up on Avenida del Imán, a signposted 10-minute walk from the West gates.',
      accessible: true,
    },
  ],
};

const STORAGE_KEYS = {
  venue: 'arenaflow_venue_data',
  snapshot: 'arenaflow_ops_snapshot',
};

/**
 * Saves the static venue profile to localStorage for offline access.
 *
 * @param venue - The venue profile to store.
 */
export function saveVenueData(venue: VenueProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.venue, JSON.stringify(venue));
  } catch {
    // Ignore Storage errors
  }
}

/**
 * Retrieves the cached venue profile from localStorage, falling back to the
 * in-memory default if absent or inaccessible.
 *
 * @returns The active venue profile.
 */
export function getVenueData(): VenueProfile {
  try {
    const cachedVenueStr = localStorage.getItem(STORAGE_KEYS.venue);
    return cachedVenueStr ? (JSON.parse(cachedVenueStr) as VenueProfile) : FALLBACK_VENUE;
  } catch {
    return FALLBACK_VENUE;
  }
}

/**
 * Saves the latest operations snapshot to localStorage.
 *
 * @param snapshot - The snapshot object to store.
 */
export function saveOpsSnapshot(snapshot: OpsSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEYS.snapshot, JSON.stringify(snapshot));
  } catch {
    // Ignore Storage errors
  }
}

/**
 * Retrieves the cached operations snapshot from localStorage.
 *
 * @returns The cached snapshot, or null if not found.
 */
export function getOpsSnapshot(): OpsSnapshot | null {
  try {
    const cachedSnapshotStr = localStorage.getItem(STORAGE_KEYS.snapshot);
    return cachedSnapshotStr ? (JSON.parse(cachedSnapshotStr) as OpsSnapshot) : null;
  } catch {
    return null;
  }
}

const OFFLINE_ANSWERS: Record<
  SupportedLanguage,
  {
    gates: string;
    facilities: string;
    transit: string;
    accessible: string;
    default: string;
  }
> = {
  en: {
    gates:
      'Offline: Entry gates at Estadio Azteca are Gates 1 to 6. Accessible step-free entry is available at Gates 1, 3, 4, and 6.',
    facilities:
      'Offline: Facilities include Concourses with Food Courts, Water Refill Stations, Multi-Faith Prayer Room (L2 North Stand), and Family Room (L1 South Stand).',
    transit:
      'Offline: Transit options include Tren Ligero (Estadio Azteca station - step-free), FIFA Fan Shuttle (South Plaza Plaza), and official parking near Gate 6.',
    accessible:
      'Offline: Step-free gates are 1, 3, 4, and 6. Accessible seating platforms are in the West Stand lower via Gate 6. A sensory room is near section 230.',
    default:
      'Offline: Showing cached venue data. For direct assistance, please visit the Guest Services Desks located inside Gates 1, 4, and 6.',
  },
  es: {
    gates:
      'Sin conexión: Las puertas de entrada en el Estadio Azteca son las puertas 1 a 6. Las puertas accesibles y sin escalones son las 1, 3, 4 y 6.',
    facilities:
      'Sin conexión: Las instalaciones incluyen áreas de comida, estaciones de agua gratis, sala de oración multife (Nivel 2) y sala familiar (Nivel 1).',
    transit:
      'Sin conexión: Tren Ligero (estación Estadio Azteca - accesible), Lanzadera FIFA (Plaza Sur) y estacionamiento oficial cerca de la Puerta 6.',
    accessible:
      'Sin conexión: Las puertas accesibles son la 1, 3, 4 y 6. Las plataformas de asientos accesibles se encuentran en la tribuna oeste a través de la Puerta 6.',
    default:
      'Sin conexión: Mostrando datos guardados. Para obtener ayuda, visite los mostradores de atención al visitante en las puertas 1, 4 y 6.',
  },
  fr: {
    gates:
      "Hors ligne : Les portes d'accès sont les portes 1 à 6. Entrée accessible sans marche disponible aux portes 1, 3, 4 et 6.",
    facilities:
      "Hors ligne : Les installations comprennent des restaurants, des points d'eau gratuits, une salle de prière (L2) et une salle familiale (L1).",
    transit:
      'Hors ligne : Tren Ligero (station Estadio Azteca - accessible), Navette FIFA Fan Shuttle (Plaza Sud) et parking officiel près de la Porte 6.',
    accessible:
      "Hors ligne : Les portes d'accès sans marches sont 1, 3, 4 et 6. Les plateformes de sièges accessibles sont situées dans la tribune ouest.",
    default:
      'Hors ligne : Affichage des données locales. Pour toute aide, veuillez vous adresser aux bureaux des services aux visiteurs aux portes 1, 4 et 6.',
  },
  pt: {
    gates:
      'Offline: Os portões de entrada são os portões 1 a 6. Entrada acessível sem degraus disponível nos portões 1, 3, 4 e 6.',
    facilities:
      'Offline: As instalações incluem praças de alimentação, estações de água grátis, sala de oração (L2) e sala de cuidados familiares (L1).',
    transit:
      'Offline: Opções de trânsito incluem Tren Ligero (Estação Estadio Azteca - acessível), FIFA Fan Shuttle (Praça Sul) e estacionamento oficial.',
    accessible:
      'Offline: Portões acessíveis são 1, 3, 4 e 6. Plataformas de assentos acessíveis estão localizadas na arquibancada oeste via Portão 6.',
    default:
      'Offline: Mostrando dados armazenados em cache. Para obter ajuda, visite os balcões de atendimento aos visitantes nos portões 1, 4 e 6.',
  },
  ar: {
    gates:
      'وضع غير متصل بالشبكة: بوابات الدخول في أستاد أزتيكا هي البوابات من 1 إلى 6. يتوفر مدخل سهل وخالٍ من الدرج في البوابات 1 و 3 و 4 و 6.',
    facilities:
      'وضع غير متصل بالشبكة: تشمل المرافق صالات طعام، ومحطات تعبئة مياه مجانية، وغرفة صلاة متعددة الأديان (الطابق الثاني)، وغرفة رعاية عائلية.',
    transit:
      'وضع غير متصل بالشبكة: خيارات النقل تشمل القطار الخفيف (محطة أستاد أزتيكا - سهلة الوصول)، وحافلة مشجعي الفيفا، ومواقف السيارات الرسمية.',
    accessible:
      'وضع غير متصل بالشبكة: البوابات الخالية من الدرج هي 1 و 3 و 4 و 6. منصات المقاعد المخصصة لذوي الاحتياجات الخاصة متوفرة في المدرج الغربي.',
    default:
      'وضع غير متصل بالشبكة: يتم عرض بيانات الموقع المخزنة مؤقتًا. للحصول على المساعدة المباشرة، يرجى زيارة مكاتب خدمات الضيوف في البوابات 1 و 4 و 6.',
  },
};

type OfflineCategory = 'gates' | 'facilities' | 'transit' | 'accessible';

/** Keywords (across all supported languages) that route a question to each
 *  canned offline category. Checked in order; first match wins. */
const CATEGORY_KEYWORDS: readonly (readonly [OfflineCategory, readonly string[]])[] = [
  ['gates', ['gate', 'entrance', 'section', 'بواب', 'مدخل', 'puerta', 'porte', 'portão']],
  [
    'facilities',
    [
      'food',
      'eat',
      'water',
      'refill',
      'prayer',
      'family',
      'طعام',
      'ماء',
      'صلاة',
      'comida',
      'nourriture',
      'refeição',
    ],
  ],
  [
    'transit',
    ['metro', 'transit', 'bus', 'shuttle', 'transport', 'حافل', 'مترو', 'autobús', 'ônibus'],
  ],
  [
    'accessible',
    [
      'access',
      'wheelchair',
      'step-free',
      'disab',
      'mobility',
      'كرسي',
      'سهل',
      'accesible',
      'cadeira',
      'fauteuil',
    ],
  ],
];

/** Picks the offline canned-answer category a free-text question maps to,
 *  or `null` if nothing matches (caller falls back to the default answer). */
function matchOfflineCategory(query: string): OfflineCategory | null {
  const match = CATEGORY_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => query.includes(keyword)),
  );
  return match ? match[0] : null;
}

/**
 * Picks a canned response for the fan question based on keyword matching when the client is offline.
 *
 * @param question - The raw user query.
 * @param language - The preferred language code.
 * @returns The canned offline response string.
 */
export function getOfflineAssistantResponse(question: string, language: SupportedLanguage): string {
  const query = question.toLowerCase();
  const answers = OFFLINE_ANSWERS[language];
  const category = matchOfflineCategory(query);
  return category ? answers[category] : answers.default;
}
