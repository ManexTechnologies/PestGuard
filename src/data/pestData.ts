export interface PestInfo {
  id: string;
  name: string;
  scientificName: string;
  type: string;
  cropAffected: string[];
  description: string;
  damageSymptoms: string[];
  imageUrl: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  season: string;
  treatments: Treatment[];
}

export interface Treatment {
  name: string;
  type: 'organic' | 'cultural' | 'biological' | 'chemical';
  description: string;
  effectiveness: 'high' | 'medium' | 'low';
  cost: 'low' | 'medium' | 'high';
  safetyWarning?: string;
}

export interface PestReport {
  id: string;
  pest_name: string;
  pest_type: string;
  confidence: number;
  crop_affected: string;
  severity: string;
  latitude: number;
  longitude: number;
  location_name: string;
  province: string;
  description: string;
  treatment_applied?: string;
  effectiveness_rating?: number;
  image_url?: string;
  status: string;
  created_at: string;
}

export const CROP_TYPES = [
  'Maize', 'Sorghum', 'Rapoko', 'Wheat', 'Millet', 'Tobacco',
  'Cotton', 'Groundnuts', 'Soybeans', 'Sunflower', 'Sugarcane', 'Vegetables', 'Citrus'
];

export const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands'
];

export const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

export const SEVERITY_DOT_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-red-100 text-red-700',
  monitoring: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

export const KNOWLEDGE_BASE: PestInfo[] = [
  {
    id: '1',
    name: 'Fall Armyworm',
    scientificName: 'Spodoptera frugiperda',
    type: 'Lepidoptera',
    cropAffected: ['Maize', 'Sorghum', 'Wheat'],
    description: 'One of the most destructive pests in sub-Saharan Africa. Larvae feed on leaves, tassels, and ears of maize, causing severe yield losses up to 70%.',
    damageSymptoms: ['Ragged holes in leaves', 'Sawdust-like frass in leaf whorls', 'Damaged tassels and ears', 'Windowpane feeding on young leaves'],
    imageUrl: '/src/assets/Fall Armyworm.jpeg',
    severity: 'critical',
    season: 'October - March (rainy season)',
    treatments: [
      { name: 'Neem Extract Spray', type: 'organic', description: 'Mix 50ml neem oil with 1L water and spray on affected plants early morning', effectiveness: 'medium', cost: 'low' },
      { name: 'Hand Picking', type: 'cultural', description: 'Manually remove larvae from leaf whorls during early infestation', effectiveness: 'medium', cost: 'low' },
      { name: 'Trichogramma Wasps', type: 'biological', description: 'Release parasitic wasps that attack armyworm eggs', effectiveness: 'high', cost: 'medium' },
      { name: 'Emamectin Benzoate', type: 'chemical', description: 'Apply at 0.4ml/L water when larvae are small', effectiveness: 'high', cost: 'high', safetyWarning: 'Wear protective gear. Do not spray near water sources. Observe 14-day pre-harvest interval.' },
    ]
  },
  {
    id: '2',
    name: 'African Bollworm',
    scientificName: 'Helicoverpa armigera',
    type: 'Lepidoptera',
    cropAffected: ['Cotton', 'Tobacco', 'Vegetables'],
    description: 'A major pest of cotton and many other crops. Larvae bore into bolls, fruits, and pods causing direct damage to harvestable parts.',
    damageSymptoms: ['Holes in cotton bolls', 'Damaged fruit and pods', 'Frass around entry holes', 'Premature boll opening'],
    imageUrl: '/src/assets/African Bollworm.jpeg',
    severity: 'high',
    season: 'November - April',
    treatments: [
      { name: 'Crop Rotation', type: 'cultural', description: 'Rotate with non-host crops to break pest cycle', effectiveness: 'medium', cost: 'low' },
      { name: 'Bt Spray', type: 'biological', description: 'Apply Bacillus thuringiensis spray on young larvae', effectiveness: 'high', cost: 'medium' },
      { name: 'Pyrethroid Spray', type: 'chemical', description: 'Apply cypermethrin at recommended rates', effectiveness: 'high', cost: 'high', safetyWarning: 'Toxic to bees. Spray in evening. Wear full protective clothing.' },
    ]
  },
  {
    id: '3',
    name: 'Red Spider Mite',
    scientificName: 'Tetranychus urticae',
    type: 'Acarina',
    cropAffected: ['Tobacco', 'Cotton', 'Vegetables'],
    description: 'Tiny mites that suck plant sap from leaves, causing yellowing and bronzing. Thrives in hot, dry conditions common in Zimbabwe.',
    damageSymptoms: ['Yellow stippling on leaves', 'Fine webbing on leaf undersides', 'Bronzed or brown leaves', 'Leaf drop in severe cases'],
    imageUrl: '/src/assets/Red Spider Mite.jpeg',
    severity: 'high',
    season: 'August - November (dry season)',
    treatments: [
      { name: 'Water Spray', type: 'cultural', description: 'Strong water jet to dislodge mites from leaves', effectiveness: 'low', cost: 'low' },
      { name: 'Predatory Mites', type: 'biological', description: 'Release Phytoseiulus persimilis predatory mites', effectiveness: 'high', cost: 'medium' },
      { name: 'Sulphur Dust', type: 'organic', description: 'Apply wettable sulphur at 3g/L water', effectiveness: 'medium', cost: 'low' },
      { name: 'Abamectin', type: 'chemical', description: 'Apply at 0.5ml/L water, targeting leaf undersides', effectiveness: 'high', cost: 'high', safetyWarning: 'Highly toxic to aquatic organisms. Do not contaminate water.' },
    ]
  },
  {
    id: '4',
    name: 'Stalk Borer',
    scientificName: 'Busseola fusca',
    type: 'Lepidoptera',
    cropAffected: ['Maize', 'Sorghum', 'Sugarcane'],
    description: 'Larvae bore into stems of cereal crops, causing dead hearts in young plants and stem breakage in mature plants.',
    damageSymptoms: ['Dead heart in young plants', 'Bore holes in stems', 'Frass at stem base', 'Stem breakage and lodging'],
    imageUrl: '/src/assets/Stalk Borer.jpeg',
    severity: 'high',
    season: 'November - February',
    treatments: [
      { name: 'Early Planting', type: 'cultural', description: 'Plant early to avoid peak moth flight period', effectiveness: 'medium', cost: 'low' },
      { name: 'Stem Splitting', type: 'cultural', description: 'Split affected stems to remove larvae manually', effectiveness: 'low', cost: 'low' },
      { name: 'Trichogramma Release', type: 'biological', description: 'Release egg parasitoids at moth flight time', effectiveness: 'medium', cost: 'medium' },
    ]
  },
  {
    id: '5',
    name: 'Aphids',
    scientificName: 'Rhopalosiphum maidis',
    type: 'Hemiptera',
    cropAffected: ['Maize', 'Vegetables', 'Wheat'],
    description: 'Small sap-sucking insects that form colonies on leaves and stems. They excrete honeydew which promotes sooty mold growth.',
    damageSymptoms: ['Curled and yellowed leaves', 'Sticky honeydew on leaves', 'Sooty mold growth', 'Stunted plant growth'],
    imageUrl: '/src/assets/Aphids.jpeg',
    severity: 'medium',
    season: 'Year-round, peaks in warm weather',
    treatments: [
      { name: 'Soap Spray', type: 'organic', description: 'Mix 5ml liquid soap per liter of water and spray directly on aphids', effectiveness: 'medium', cost: 'low' },
      { name: 'Ladybird Beetles', type: 'biological', description: 'Encourage or release ladybird beetles as natural predators', effectiveness: 'high', cost: 'low' },
      { name: 'Garlic-Chili Spray', type: 'organic', description: 'Blend garlic and chili, strain and spray on plants', effectiveness: 'medium', cost: 'low' },
      { name: 'Imidacloprid', type: 'chemical', description: 'Apply as seed treatment or foliar spray at 0.3ml/L', effectiveness: 'high', cost: 'medium', safetyWarning: 'Harmful to bees. Do not apply during flowering.' },
    ]
  },
  {
    id: '6',
    name: 'Cutworm',
    scientificName: 'Agrotis spp.',
    type: 'Lepidoptera',
    cropAffected: ['Maize', 'Vegetables', 'Tobacco'],
    description: 'Nocturnal caterpillars that cut seedlings at ground level. Most damaging to newly planted crops.',
    damageSymptoms: ['Seedlings cut at soil level', 'Missing plants in rows', 'Larvae curled in soil near damaged plants', 'Wilted fallen seedlings'],
    imageUrl: '/src/assets/Cutworm.jpeg',
    severity: 'medium',
    season: 'September - December (planting season)',
    treatments: [
      { name: 'Bran Bait', type: 'cultural', description: 'Mix bran with molasses and carbaryl, scatter around seedlings at dusk', effectiveness: 'high', cost: 'low' },
      { name: 'Collar Protection', type: 'cultural', description: 'Place cardboard collars around seedling stems', effectiveness: 'medium', cost: 'low' },
      { name: 'Soil Preparation', type: 'cultural', description: 'Plough and harrow well before planting to expose larvae', effectiveness: 'medium', cost: 'low' },
    ]
  },
  {
    id: '7',
    name: 'Whitefly',
    scientificName: 'Bemisia tabaci',
    type: 'Hemiptera',
    cropAffected: ['Tobacco', 'Cotton', 'Vegetables'],
    description: 'Tiny white flying insects that suck sap and transmit viral diseases. A major vector for tobacco leaf curl virus.',
    damageSymptoms: ['White flies when plants disturbed', 'Yellowing leaves', 'Sticky honeydew', 'Leaf curl from viral transmission'],
    imageUrl: '/src/assets/Whitefly.jpeg',
    severity: 'high',
    season: 'Year-round in warm areas',
    treatments: [
      { name: 'Yellow Sticky Traps', type: 'cultural', description: 'Place yellow sticky traps around field edges to monitor and trap adults', effectiveness: 'low', cost: 'low' },
      { name: 'Neem Oil Spray', type: 'organic', description: 'Apply neem oil at 3ml/L water every 7 days', effectiveness: 'medium', cost: 'low' },
      { name: 'Encarsia Wasps', type: 'biological', description: 'Release parasitic wasps for greenhouse crops', effectiveness: 'high', cost: 'medium' },
      { name: 'Spiromesifen', type: 'chemical', description: 'Apply at recommended rate for whitefly control', effectiveness: 'high', cost: 'high', safetyWarning: 'Follow label instructions strictly. Rotate with other chemical groups.' },
    ]
  },
  {
    id: '8',
    name: 'Maize Weevil',
    scientificName: 'Sitophilus zeamais',
    type: 'Coleoptera',
    cropAffected: ['Maize', 'Sorghum', 'Wheat'],
    description: 'The most important storage pest of maize in Zimbabwe. Adults bore into grain kernels to lay eggs, and larvae feed inside.',
    damageSymptoms: ['Small round holes in grain', 'Powdery grain dust', 'Grain weight loss', 'Heating of stored grain'],
    imageUrl: '/src/assets/Maize Weevil.jpeg',
    severity: 'high',
    season: 'Post-harvest (April - September)',
    treatments: [
      { name: 'Hermetic Storage', type: 'cultural', description: 'Use airtight bags or containers to suffocate weevils', effectiveness: 'high', cost: 'medium' },
      { name: 'Ash Treatment', type: 'organic', description: 'Mix wood ash with stored grain at 10% by weight', effectiveness: 'medium', cost: 'low' },
      { name: 'Solar Drying', type: 'cultural', description: 'Dry grain to below 13% moisture before storage', effectiveness: 'medium', cost: 'low' },
      { name: 'Actellic Super', type: 'chemical', description: 'Apply as dust at 50g per 90kg bag of grain', effectiveness: 'high', cost: 'medium', safetyWarning: 'Do not eat treated grain within 2 weeks. Store in ventilated area.' },
    ]
  },
  {
    id: '9',
    name: 'Diamondback Moth',
    scientificName: 'Plutella xylostella',
    type: 'Lepidoptera',
    cropAffected: ['Vegetables'],
    description: 'A major pest of brassica crops (cabbage, rape, kale). Larvae create window-pane damage on leaves.',
    damageSymptoms: ['Window-pane holes in leaves', 'Small green larvae on leaf undersides', 'Skeletonized leaves', 'Reduced head formation'],
    imageUrl: '/src/assets/Diamondback moth.jpeg',
    severity: 'medium',
    season: 'Year-round, peaks in dry season',
    treatments: [
      { name: 'Bt Spray', type: 'biological', description: 'Apply Bacillus thuringiensis weekly during infestation', effectiveness: 'high', cost: 'medium' },
      { name: 'Intercropping', type: 'cultural', description: 'Plant with tomatoes or onions to repel moths', effectiveness: 'medium', cost: 'low' },
      { name: 'Neem Spray', type: 'organic', description: 'Apply neem extract every 5-7 days', effectiveness: 'medium', cost: 'low' },
    ]
  },
  {
    id: '10',
    name: 'Termites',
    scientificName: 'Macrotermes spp.',
    type: 'Isoptera',
    cropAffected: ['Maize', 'Sugarcane', 'Groundnuts'],
    description: 'Subterranean insects that attack crop roots and stems. Particularly damaging during dry spells when plants are stressed.',
    damageSymptoms: ['Wilting despite adequate moisture', 'Mud tubes on stems', 'Hollowed roots and stems', 'Termite mounds near fields'],
    imageUrl: '/src/assets/Termites.jpeg',
    severity: 'medium',
    season: 'Year-round, worse in dry season',
    treatments: [
      { name: 'Mound Destruction', type: 'cultural', description: 'Destroy termite mounds near crop fields', effectiveness: 'medium', cost: 'low' },
      { name: 'Wood Ash Barrier', type: 'organic', description: 'Apply wood ash around plant bases as deterrent', effectiveness: 'low', cost: 'low' },
      { name: 'Seed Treatment', type: 'chemical', description: 'Treat seeds with imidacloprid before planting', effectiveness: 'high', cost: 'medium', safetyWarning: 'Handle treated seeds with gloves. Do not feed to animals.' },
    ]
  },
  {
    id: '11',
    name: 'Tobacco Budworm',
    scientificName: 'Chloridea virescens',
    type: 'Lepidoptera',
    cropAffected: ['Tobacco'],
    description: 'Larvae feed on tobacco buds and young leaves, causing significant damage to leaf quality and yield.',
    damageSymptoms: ['Damaged terminal buds', 'Holes in young leaves', 'Frass in leaf whorls', 'Distorted leaf growth'],
    imageUrl: '/src/assets/Tobacco budworm.jpeg',
    severity: 'high',
    season: 'October - February',
    treatments: [
      { name: 'Scouting & Hand Picking', type: 'cultural', description: 'Regular field scouting and manual removal of larvae', effectiveness: 'medium', cost: 'low' },
      { name: 'Bt Application', type: 'biological', description: 'Apply Bt kurstaki when larvae are small', effectiveness: 'high', cost: 'medium' },
      { name: 'Chlorantraniliprole', type: 'chemical', description: 'Apply at label rate during early infestation', effectiveness: 'high', cost: 'high', safetyWarning: 'Follow tobacco-specific label instructions. Observe withholding period.' },
    ]
  },
  {
    id: '12',
    name: 'Quelea Birds',
    scientificName: 'Quelea quelea',
    type: 'Aves',
    cropAffected: ['Wheat', 'Sorghum', 'Maize'],
    description: 'The most destructive bird pest in Africa. Massive flocks can devastate grain crops in hours. A single flock can number millions.',
    damageSymptoms: ['Stripped grain heads', 'Broken stems from bird weight', 'Rapid crop loss', 'Large flocks visible at dawn/dusk'],
    imageUrl: '/src/assets/Quelea birds.jpeg',
    severity: 'critical',
    season: 'March - June (grain ripening)',
    treatments: [
      { name: 'Bird Scaring', type: 'cultural', description: 'Use reflective tape, scarecrows, and noise makers', effectiveness: 'low', cost: 'low' },
      { name: 'Early Harvesting', type: 'cultural', description: 'Harvest crops as early as possible when mature', effectiveness: 'medium', cost: 'low' },
      { name: 'Report to AGRITEX', type: 'cultural', description: 'Report large flocks to agricultural extension for coordinated control', effectiveness: 'high', cost: 'low' },
    ]
  },
  {
    id: '13',
    name: 'Fruit Fly',
    scientificName: 'Ceratitis capitata',
    type: 'Diptera',
    cropAffected: ['Citrus', 'Vegetables'],
    description: 'Females lay eggs in ripening fruit. Larvae feed inside, causing fruit rot and drop. Major export quarantine pest.',
    damageSymptoms: ['Small puncture marks on fruit', 'Soft spots on fruit', 'Larvae inside fruit', 'Premature fruit drop'],
    imageUrl: '/src/assets/Fruit fly.jpeg',
    severity: 'medium',
    season: 'October - April (fruiting season)',
    treatments: [
      { name: 'Protein Bait Traps', type: 'cultural', description: 'Hang protein bait traps in fruit trees to monitor and trap adults', effectiveness: 'medium', cost: 'low' },
      { name: 'Sanitation', type: 'cultural', description: 'Collect and destroy fallen fruit to break breeding cycle', effectiveness: 'medium', cost: 'low' },
      { name: 'Bait Spray', type: 'chemical', description: 'Apply protein bait mixed with spinosad as spot spray', effectiveness: 'high', cost: 'medium', safetyWarning: 'Apply as spot treatment only. Do not spray entire tree canopy.' },
    ]
  },
  {
    id: '14',
    name: 'Cotton Stainer',
    scientificName: 'Dysdercus spp.',
    type: 'Hemiptera',
    cropAffected: ['Cotton'],
    description: 'Bugs that feed on cotton seeds, staining the lint and reducing quality. Major economic pest of cotton in Zimbabwe.',
    damageSymptoms: ['Stained cotton lint', 'Shriveled seeds', 'Bug colonies on open bolls', 'Reduced lint quality'],
    imageUrl: '/src/assets/Cotton stainer.jpeg',
    severity: 'high',
    season: 'February - May (boll opening)',
    treatments: [
      { name: 'Field Sanitation', type: 'cultural', description: 'Remove alternative host plants (hibiscus) near cotton fields', effectiveness: 'medium', cost: 'low' },
      { name: 'Timely Picking', type: 'cultural', description: 'Pick cotton promptly when bolls open', effectiveness: 'high', cost: 'low' },
      { name: 'Carbaryl Dust', type: 'chemical', description: 'Apply carbaryl dust to open bolls', effectiveness: 'high', cost: 'medium', safetyWarning: 'Toxic to bees and aquatic life. Apply in calm conditions.' },
    ]
  },
  {
    id: '15',
    name: 'Leaf Miner',
    scientificName: 'Liriomyza spp.',
    type: 'Diptera',
    cropAffected: ['Vegetables'],
    description: 'Small fly larvae that tunnel between leaf surfaces creating visible serpentine mines. Reduces photosynthesis and crop quality.',
    damageSymptoms: ['Serpentine white trails on leaves', 'Blotch mines on leaves', 'Premature leaf drop', 'Reduced plant vigor'],
    imageUrl: '/src/assets/Leaf miner.jpeg',
    severity: 'low',
    season: 'Year-round in irrigated areas',
    treatments: [
      { name: 'Remove Affected Leaves', type: 'cultural', description: 'Pick and destroy mined leaves to reduce population', effectiveness: 'medium', cost: 'low' },
      { name: 'Parasitic Wasps', type: 'biological', description: 'Diglyphus wasps naturally control leaf miners', effectiveness: 'high', cost: 'low' },
      { name: 'Neem Spray', type: 'organic', description: 'Apply neem oil to deter egg-laying adults', effectiveness: 'medium', cost: 'low' },
    ]
  },
  {
    id: '16',
    name: 'Thrips',
    scientificName: 'Thrips tabaci',
    type: 'Thysanoptera',
    cropAffected: ['Vegetables', 'Tobacco'],
    description: 'Tiny insects that rasp leaf surfaces and suck sap. Can transmit tospoviruses. Common on onions and tobacco.',
    damageSymptoms: ['Silver streaks on leaves', 'Distorted leaves', 'Brown leaf tips', 'Reduced bulb size in onions'],
    imageUrl: '/src/assets/Thrips.jpeg',
    severity: 'medium',
    season: 'Dry season peaks',
    treatments: [
      { name: 'Blue Sticky Traps', type: 'cultural', description: 'Use blue sticky traps to monitor and reduce thrips numbers', effectiveness: 'low', cost: 'low' },
      { name: 'Mulching', type: 'cultural', description: 'Apply reflective mulch to disorient thrips', effectiveness: 'medium', cost: 'low' },
      { name: 'Spinosad', type: 'biological', description: 'Apply spinosad-based products for organic control', effectiveness: 'high', cost: 'medium' },
    ]
  },
  {
    id: '17',
    name: 'Locust',
    scientificName: 'Locusta migratoria',
    type: 'Orthoptera',
    cropAffected: ['Maize', 'Wheat', 'Sorghum', 'Vegetables'],
    description: 'Migratory locusts form devastating swarms that can strip entire fields bare. A national emergency pest requiring coordinated response.',
    damageSymptoms: ['Complete defoliation', 'Stripped bark on young plants', 'Massive swarms visible', 'Total crop loss possible'],
    imageUrl: '/src/assets/Locust.jpeg',
    severity: 'critical',
    season: 'Variable, linked to rainfall patterns',
    treatments: [
      { name: 'Early Warning Report', type: 'cultural', description: 'Report any locust sightings immediately to AGRITEX or Plant Protection department', effectiveness: 'high', cost: 'low' },
      { name: 'Metarhizium Fungus', type: 'biological', description: 'Green Muscle bio-pesticide for locust control', effectiveness: 'medium', cost: 'medium' },
      { name: 'Aerial Spraying', type: 'chemical', description: 'Government-coordinated aerial spraying of swarms', effectiveness: 'high', cost: 'high', safetyWarning: 'Only conducted by trained teams. Stay away from spray zones.' },
    ]
  },
  {
    id: '18',
    name: 'Grain Moth',
    scientificName: 'Sitotroga cerealella',
    type: 'Lepidoptera',
    cropAffected: ['Maize', 'Wheat', 'Sorghum'],
    description: 'A storage pest whose larvae develop inside grain kernels. Can cause significant losses in stored grain if not managed.',
    damageSymptoms: ['Small moths flying around stored grain', 'Round emergence holes in grain', 'Grain dust and webbing', 'Reduced grain weight'],
    imageUrl: '/src/assets/Grain moth.jpeg',
    severity: 'medium',
    season: 'Post-harvest storage period',
    treatments: [
      { name: 'Clean Storage', type: 'cultural', description: 'Clean storage facilities thoroughly before storing new grain', effectiveness: 'medium', cost: 'low' },
      { name: 'Triple Bagging', type: 'cultural', description: 'Store grain in PICS bags (triple-layer hermetic bags)', effectiveness: 'high', cost: 'medium' },
      { name: 'Diatomaceous Earth', type: 'organic', description: 'Mix food-grade DE with grain at 1kg per tonne', effectiveness: 'high', cost: 'low' },
    ]
  },
  {
    id: '19',
    name: 'Tsetse Fly',
    scientificName: 'Glossina spp.',
    type: 'Diptera',
    cropAffected: ['Livestock'],
    description: 'Blood-feeding flies that transmit trypanosomiasis (sleeping sickness) to cattle and humans. Found in river valleys and woodland areas.',
    damageSymptoms: ['Emaciated cattle', 'Reduced milk production', 'Abortion in pregnant animals', 'Progressive weakness and death'],
    imageUrl: '/src/assets/Tsetse fly.jpeg',
    severity: 'high',
    season: 'Year-round in endemic areas',
    treatments: [
      { name: 'Insecticide-Treated Targets', type: 'cultural', description: 'Deploy blue-black cloth targets treated with insecticide', effectiveness: 'high', cost: 'medium' },
      { name: 'Pour-on Treatment', type: 'chemical', description: 'Apply deltamethrin pour-on to cattle every 2 weeks', effectiveness: 'high', cost: 'medium', safetyWarning: 'Follow veterinary guidance. Do not use on sick animals.' },
      { name: 'Bush Clearing', type: 'cultural', description: 'Clear riverine bush to reduce tsetse habitat', effectiveness: 'medium', cost: 'high' },
    ]
  },
  {
    id: '20',
    name: 'Stem Borer (Sugarcane)',
    scientificName: 'Eldana saccharina',
    type: 'Lepidoptera',
    cropAffected: ['Sugarcane'],
    description: 'Major pest of sugarcane in the lowveld. Larvae bore into cane stalks reducing sugar content and causing stalk breakage.',
    damageSymptoms: ['Bore holes in cane stalks', 'Red discoloration inside stalks', 'Dead hearts in young cane', 'Reduced sugar recovery'],
    imageUrl: '/src/assets/Stem borer.jpeg',
    severity: 'high',
    season: 'Year-round, peaks in warm wet season',
    treatments: [
      { name: 'Trash Removal', type: 'cultural', description: 'Remove and burn cane trash after harvest to destroy pupae', effectiveness: 'medium', cost: 'low' },
      { name: 'Resistant Varieties', type: 'cultural', description: 'Plant borer-resistant sugarcane varieties', effectiveness: 'high', cost: 'low' },
      { name: 'Trichogramma Release', type: 'biological', description: 'Release egg parasitoids during moth flight peaks', effectiveness: 'medium', cost: 'medium' },
    ]
  },
];

export const EMERGENCY_CONTACTS = [
  { name: 'AGRITEX Hotline', phone: '+263 242 700 601', description: 'Agricultural Technical and Extension Services' },
  { name: 'Plant Protection Research Institute', phone: '+263 242 704 531', description: 'Pest identification and control advice' },
  { name: 'Tobacco Research Board', phone: '+263 279 22 311', description: 'Tobacco pest and disease queries' },
  { name: 'Cotton Research Institute', phone: '+263 268 22 321', description: 'Cotton pest management' },
  { name: 'Department of Veterinary Services', phone: '+263 242 791 355', description: 'Livestock pest and disease reporting' },
];
