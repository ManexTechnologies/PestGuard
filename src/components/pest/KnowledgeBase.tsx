import React, { useState } from 'react';
import './KnowledgeBase.css';

// ─── Vite-safe image URLs (handles filenames with spaces) ─────────────────────
const africanBollwormImg = new URL('@/assets/African Bollworm.jpeg', import.meta.url).href;
const aphidsImg          = new URL('@/assets/Aphids.jpeg',           import.meta.url).href;
const cottonStainerImg   = new URL('@/assets/Cotton Stainer.jpeg',   import.meta.url).href;
const cutwormImg         = new URL('@/assets/Cutworm.jpeg',          import.meta.url).href;
const diamondbackMothImg = new URL('@/assets/Diamondback moth.jpeg', import.meta.url).href;
const fallArmywormImg    = new URL('@/assets/Fall Armyworm.jpeg',    import.meta.url).href;
const fruitFlyImg        = new URL('@/assets/Fruit fly.jpeg',        import.meta.url).href;
const grainMothImg       = new URL('@/assets/Grain moth.jpeg',       import.meta.url).href;
const leafMinerImg       = new URL('@/assets/Leaf miner.jpeg',       import.meta.url).href;
const locustImg          = new URL('@/assets/Locust.jpeg',           import.meta.url).href;
const maizeWeevilImg     = new URL('@/assets/Maize Weevil.jpeg',     import.meta.url).href;
const quelaeBirdsImg     = new URL('@/assets/Quelea birds.jpeg',     import.meta.url).href;
const redSpiderMiteImg   = new URL('@/assets/Red Spider Mite.jpeg',  import.meta.url).href;
const stalkBorerImg      = new URL('@/assets/Stalk Borer.jpeg',      import.meta.url).href;
const stemBorerImg       = new URL('@/assets/Stem borer.jpeg',       import.meta.url).href;
const termitesImg        = new URL('@/assets/Termites.jpeg',         import.meta.url).href;
const thripsImg          = new URL('@/assets/Thrips.jpeg',           import.meta.url).href;
const tobaccoBudwormImg  = new URL('@/assets/Tobacco budworm.jpeg',  import.meta.url).href;
const tsetseFlyImg       = new URL('@/assets/Tsetse fly.jpeg',       import.meta.url).href;
const whiteflyImg        = new URL('@/assets/Whitefly.jpeg',         import.meta.url).href;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pest {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  imageUrl: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cropsAffected: string[];
}

// ─── Pest Data ────────────────────────────────────────────────────────────────
const PESTS: Pest[] = [
  {
    id: '1',
    name: 'African Bollworm',
    scientificName: 'Helicoverpa armigera',
    description: 'A highly destructive caterpillar that bores into bolls, pods, and fruiting bodies of many crops, causing direct yield loss across Zimbabwe.',
    symptoms: ['Bore holes in cotton bolls and pods', 'Frass and droppings at entry points', 'Damaged and rotting fruit bodies', 'Larvae visible inside bolls'],
    treatment: ['Apply Bt (Bacillus thuringiensis) sprays early', 'Use synthetic pyrethroids for severe infestations', 'Introduce parasitic wasps as biocontrol', 'Rotate insecticide classes to prevent resistance'],
    prevention: ['Use pheromone traps to monitor adult moths', 'Plant early to avoid peak bollworm season', 'Destroy crop residues after harvest', 'Use resistant or tolerant varieties where available'],
    imageUrl: africanBollwormImg,
    severity: 'Critical',
    cropsAffected: ['Cotton', 'Maize', 'Tomatoes', 'Sorghum'],
  },
  {
    id: '2',
    name: 'Aphids',
    scientificName: 'Aphidoidea',
    description: 'Small sap-sucking insects that feed on plant sap and transmit plant viruses. They reproduce quickly and can cause extensive damage.',
    symptoms: ['Curled and distorted leaves', 'Sticky honeydew on leaf surfaces', 'Stunted growth and reduced vigor', 'Sooty mold growth on honeydew'],
    treatment: ['Spray with soapy water solution', 'Apply neem oil for organic control', 'Introduce beneficial insects like ladybugs', 'Use insecticidal soaps for severe infestations'],
    prevention: ['Remove weeds that serve as alternate hosts', 'Use reflective mulches to deter aphids', 'Regular monitoring of crop health', 'Encourage natural predators in the garden'],
    imageUrl: aphidsImg,
    severity: 'Medium',
    cropsAffected: ['All crops', 'Vegetables', 'Beans', 'Cotton'],
  },
  {
    id: '3',
    name: 'Cotton Stainer',
    scientificName: 'Dysdercus spp.',
    description: 'A red and black bug that pierces cotton bolls and seeds, staining lint and reducing cotton quality and market value significantly.',
    symptoms: ['Yellow or brown staining on cotton lint', 'Shrivelled and discoloured seeds', 'Bugs visible on open bolls', 'Reduced germination of stained seeds'],
    treatment: ['Apply contact insecticides like carbaryl', 'Hand-pick bugs in small plots', 'Use pyrethroid sprays during peak infestation', 'Remove wild host plants near fields'],
    prevention: ['Timely harvesting to reduce exposure', 'Remove old bolls and crop debris', 'Weed control around field margins', 'Synchronized planting within communities'],
    imageUrl: cottonStainerImg,
    severity: 'High',
    cropsAffected: ['Cotton', 'Okra', 'Hibiscus'],
  },
  {
    id: '4',
    name: 'Cutworm',
    scientificName: 'Agrotis spp.',
    description: 'Soil-dwelling moth larvae that cut through seedling stems at ground level, causing sudden plant collapse and stand loss in fields.',
    symptoms: ['Seedlings cut at soil level', 'Wilted or collapsed young plants', 'Larvae found when soil is disturbed', 'Uneven plant stands in fields'],
    treatment: ['Apply chlorpyrifos as soil drench or bait', 'Use Bt-based soil drenches for organic control', 'Hand-dig and destroy larvae at night', 'Set bran bait traps around affected areas'],
    prevention: ['Deep plowing before planting to expose pupae', 'Destroy weeds that host adult moths', 'Delay planting after heavy rainfall periods', 'Install physical collars around seedling stems'],
    imageUrl: cutwormImg,
    severity: 'High',
    cropsAffected: ['Maize', 'Tobacco', 'Vegetables', 'Wheat'],
  },
  {
    id: '5',
    name: 'Diamondback Moth',
    scientificName: 'Plutella xylostella',
    description: 'A major pest of brassica crops worldwide. Larvae scrape leaf tissue leaving characteristic windowpane patches and are notoriously insecticide-resistant.',
    symptoms: ['Windowpane damage on cabbage leaves', 'Small greenish larvae on leaf undersides', 'Irregular holes and skeletonised leaves', 'Pupae in distinctive hammock-like cocoons'],
    treatment: ['Apply Bt (Bacillus thuringiensis) sprays', 'Rotate insecticides to manage resistance', 'Use spinosad for organic farming systems', 'Apply insect growth regulators (IGRs)'],
    prevention: ['Practice crop rotation with non-brassicas', 'Use fine mesh nets over seedbeds', 'Intercrop with aromatic herbs to deter moths', 'Monitor with pheromone traps regularly'],
    imageUrl: diamondbackMothImg,
    severity: 'High',
    cropsAffected: ['Cabbage', 'Kale', 'Broccoli', 'Cauliflower'],
  },
  {
    id: '6',
    name: 'Fall Armyworm',
    scientificName: 'Spodoptera frugiperda',
    description: 'An invasive pest that attacks maize and other cereal crops. It can cause significant yield losses if not controlled early.',
    symptoms: ['Leaf damage with holes and irregular feeding patterns', 'Frass (insect droppings) in leaf whorls', 'Stunted growth and poor plant development', 'Characteristic "windowpane" damage on leaves'],
    treatment: ['Apply neem-based pesticides as a natural control method', 'Use recommended synthetic insecticides like Emamectin benzoate', 'Handpick larvae during early infestations', 'Apply in early morning or late evening for best results'],
    prevention: ['Early planting to avoid peak pest seasons', 'Crop rotation with non-host crops', 'Regular scouting and monitoring of fields', 'Use of pheromone traps for early detection'],
    imageUrl: fallArmywormImg,
    severity: 'Critical',
    cropsAffected: ['Maize', 'Sorghum', 'Millet', 'Rice'],
  },
  {
    id: '7',
    name: 'Fruit Fly',
    scientificName: 'Bactrocera spp.',
    description: 'Female fruit flies lay eggs inside fruit. Maggots feed inside causing premature fruit drop and complete post-harvest loss in orchards.',
    symptoms: ['Premature fruit drop', 'Soft spots and dimples on fruit surface', 'Maggots found inside infested fruit', 'Oozing juice and rotting flesh'],
    treatment: ['Use protein bait sprays with malathion', 'Set male annihilation technique (MAT) traps', 'Collect and destroy fallen fruit daily', 'Apply spinosad-based organic baits'],
    prevention: ['Wrap individual fruit with paper bags', 'Harvest fruit slightly before full ripeness', 'Practice field sanitation — remove all fallen fruit', 'Install mass-trapping systems around orchards'],
    imageUrl: fruitFlyImg,
    severity: 'High',
    cropsAffected: ['Mango', 'Citrus', 'Guava', 'Tomato'],
  },
  {
    id: '8',
    name: 'Grain Moth',
    scientificName: 'Sitotroga cerealella',
    description: 'A stored grain pest where larvae bore into individual grain kernels, destroying the endosperm and drastically reducing grain quality during storage.',
    symptoms: ['Small holes in grain kernels', 'Silken webbing in grain mass', 'Presence of small moths around storage', 'Chalky, hollow grain kernels'],
    treatment: ['Apply approved grain protectant insecticides', 'Use hermetic (airtight) storage bags', 'Fumigate storage facility with phosphine', 'Sun-dry grain to reduce moisture before storage'],
    prevention: ['Store grain at moisture content below 13%', 'Clean storage facility before filling', 'Use hermetic bags or metal silos', 'Regular inspection during storage period'],
    imageUrl: grainMothImg,
    severity: 'High',
    cropsAffected: ['Maize', 'Sorghum', 'Wheat', 'Millet'],
  },
  {
    id: '9',
    name: 'Leaf Miner',
    scientificName: 'Liriomyza spp.',
    description: 'Tiny fly larvae that tunnel inside leaves creating distinctive winding mines, reducing photosynthesis and causing early leaf drop in vegetables.',
    symptoms: ['Winding white or yellowish tunnels in leaves', 'Blotchy or serpentine patterns on leaf surface', 'Premature yellowing and leaf drop', 'Small adult flies visible on leaf surfaces'],
    treatment: ['Apply abamectin or spinosad systemic sprays', 'Remove and destroy heavily mined leaves', 'Use yellow sticky traps to monitor adults', 'Release parasitic wasps like Diglyphus spp.'],
    prevention: ['Use fine mesh nets over seedling beds', 'Avoid excessive nitrogen fertilisation', 'Monitor crops regularly for early signs', 'Maintain field sanitation to reduce pupae'],
    imageUrl: leafMinerImg,
    severity: 'Medium',
    cropsAffected: ['Tomato', 'Beans', 'Spinach', 'Cucumbers'],
  },
  {
    id: '10',
    name: 'Locust',
    scientificName: 'Schistocerca gregaria',
    description: 'Highly destructive migratory pests that form large swarms capable of consuming vast amounts of vegetation in hours across entire regions.',
    symptoms: ['Complete defoliation of crops', 'Large visible swarms in the area', 'Rapid and widespread destruction', 'Bare branches and stems remaining'],
    treatment: ['Immediately report to AGRITEX or local authorities', 'Government coordinated aerial spraying', 'Community-based surveillance and reporting', 'Use of biopesticides like Metarhizium'],
    prevention: ['Monitor breeding sites regularly', 'Establish early warning systems', 'Destroy hopper bands when detected', 'Community education and preparedness'],
    imageUrl: locustImg,
    severity: 'Critical',
    cropsAffected: ['All crops', 'Pasture', 'Grains', 'Vegetables'],
  },
  {
    id: '11',
    name: 'Maize Weevil',
    scientificName: 'Sitophilus zeamais',
    description: 'One of the most serious stored grain pests. Adults and larvae feed inside maize kernels causing total destruction if storage is unmanaged.',
    symptoms: ['Round emergence holes in stored grain', 'Fine grain dust and frass in storage', 'Visible weevils crawling in grain', 'Warm and musty smell from storage'],
    treatment: ['Apply pirimiphos-methyl grain protectant dust', 'Use hermetic storage bags immediately', 'Fumigate with phosphine tablets', 'Expose grain to sunlight to kill weevils'],
    prevention: ['Dry grain thoroughly before storage', 'Clean and treat storage structures before use', 'Use hermetic bags, metal silos, or cribs', 'Never mix new grain with old infested grain'],
    imageUrl: maizeWeevilImg,
    severity: 'High',
    cropsAffected: ['Maize', 'Sorghum', 'Wheat', 'Rice'],
  },
  {
    id: '12',
    name: 'Quelea Birds',
    scientificName: 'Quelea quelea',
    description: 'Small weaver birds that form massive flocks devastating grain crops across Africa. Considered one of the most destructive bird species on the continent.',
    symptoms: ['Large flocks visible over fields', 'Pecked and damaged grain heads', 'Bare stalks with missing grains', 'Loud bird noises near harvest time'],
    treatment: ['Use bird scaring devices like noise makers', 'Install bird netting over small plots', 'Community-based coordinated scaring', 'Contact authorities for large-scale control'],
    prevention: ['Synchronized planting across communities', 'Grow bird-resistant crop varieties', 'Avoid planting near known breeding areas', 'Stagger harvest times to reduce attraction'],
    imageUrl: quelaeBirdsImg,
    severity: 'Critical',
    cropsAffected: ['Sorghum', 'Millet', 'Wheat', 'Sunflower'],
  },
  {
    id: '13',
    name: 'Red Spider Mite',
    scientificName: 'Tetranychus urticae',
    description: 'Tiny mites that colonise the underside of leaves, sucking cell contents and causing stippling, bronzing, and severe defoliation in hot dry conditions.',
    symptoms: ['Fine stippling and bronzing on upper leaf surface', 'Fine silken webbing on leaf undersides', 'Yellowing and premature leaf drop', 'Tiny moving red or brown dots on leaves'],
    treatment: ['Apply acaricides like abamectin or bifenazate', 'Spray with neem oil or insecticidal soap', 'Introduce predatory mites (Phytoseiidae)', 'Increase field humidity through irrigation'],
    prevention: ['Irrigate crops regularly during dry spells', 'Avoid dusty conditions around fields', 'Monitor crops weekly using a hand lens', 'Avoid broad-spectrum insecticides that kill natural enemies'],
    imageUrl: redSpiderMiteImg,
    severity: 'Medium',
    cropsAffected: ['Cotton', 'Beans', 'Tomatoes', 'Cucumbers'],
  },
  {
    id: '14',
    name: 'Stalk Borer',
    scientificName: 'Busseola fusca',
    description: 'A major African cereal pest. Young larvae feed on leaves while older larvae bore into stems causing the characteristic dead heart symptom in maize.',
    symptoms: ['Dead heart in young plants — central leaf dies', 'Holes and ragged windows on leaves', 'Sawdust-like frass in stem bores', 'White ear heads at tasselling stage'],
    treatment: ['Apply granular insecticides into leaf whorls', 'Use Bt sprays during early larval stage', 'Release egg parasitoid Telenomus remus', 'Apply carbaryl or lambda-cyhalothrin at whorl stage'],
    prevention: ['Plough deeply after harvest to destroy pupae', 'Early planting to avoid peak moth periods', 'Use push-pull intercropping with Desmodium', 'Remove and burn infested crop residues'],
    imageUrl: stalkBorerImg,
    severity: 'Critical',
    cropsAffected: ['Maize', 'Sorghum', 'Millet', 'Sugarcane'],
  },
  {
    id: '15',
    name: 'Stem Borer',
    scientificName: 'Chilo partellus',
    description: 'Larvae bore into the stems of cereal crops disrupting water and nutrient transport, causing significant yield losses throughout the growing season.',
    symptoms: ['Pinholes on young leaves emerging from whorls', 'Dead heart symptom in vegetative stage', 'Bored stems that break easily', 'White ears (deadheads) at reproductive stage'],
    treatment: ['Apply systemic insecticides like chlorpyrifos', 'Use Bt granules or sprays in whorls', 'Introduce larval parasitoids Cotesia sesamiae', 'Hand-remove infested stems and destroy larvae'],
    prevention: ['Intercrop maize with repellent plants (Napier grass)', 'Use push-pull system with Desmodium', 'Crop rotation breaks the pest cycle', 'Monitor fields from emergence for early signs'],
    imageUrl: stemBorerImg,
    severity: 'High',
    cropsAffected: ['Maize', 'Sorghum', 'Rice', 'Millet'],
  },
  {
    id: '16',
    name: 'Termites',
    scientificName: 'Isoptera',
    description: 'Soil-dwelling insects that attack roots, stems, and wooden structures. They can cause significant damage to both crops and farm buildings.',
    symptoms: ['Wilting plants even with adequate moisture', 'Mud tubes on stems and trunks', 'Hollowed stems that break easily', 'Visible termite tunnels near plant base'],
    treatment: ['Apply termite baits around affected areas', 'Use beneficial nematodes for biological control', 'Chemical barriers with approved termiticides', 'Remove infested plant material immediately'],
    prevention: ['Remove crop residues after harvest', 'Deep plowing to disturb termite colonies', 'Avoid waterlogging and improve drainage', 'Regular inspection of field boundaries'],
    imageUrl: termitesImg,
    severity: 'High',
    cropsAffected: ['Maize', 'Cassava', 'Vegetables', 'Trees'],
  },
  {
    id: '17',
    name: 'Thrips',
    scientificName: 'Frankliniella occidentalis',
    description: 'Tiny slender insects that rasp and suck leaf and flower tissue, causing silvery scarring, flower drop, and transmission of damaging Tospoviruses.',
    symptoms: ['Silver or bronze streaking on leaves and petals', 'Distorted and deformed flowers', 'Black frass specks on leaf surfaces', 'Fruit scarring and russeting at calyx end'],
    treatment: ['Apply spinosad or abamectin sprays', 'Use blue sticky traps for monitoring and mass trapping', 'Apply insecticidal soap to leaf undersides', 'Introduce predatory mites Amblyseius cucumeris'],
    prevention: ['Use reflective silver mulches to deter adults', 'Avoid planting near other infested crops', 'Remove and destroy volunteer plants and weeds', 'Monitor flowers closely with a hand lens weekly'],
    imageUrl: thripsImg,
    severity: 'Medium',
    cropsAffected: ['Onion', 'Cotton', 'Tobacco', 'Pepper'],
  },
  {
    id: '18',
    name: 'Tobacco Budworm',
    scientificName: 'Heliothis virescens',
    description: 'Larvae attack tobacco buds, flowers, and green bolls, causing severe losses in quality leaf production and significant seed damage in Zimbabwe.',
    symptoms: ['Ragged holes in tobacco leaves', 'Bored and destroyed flower buds', 'Larvae visible in flower heads', 'Premature bud and flower drop'],
    treatment: ['Apply Bt sprays targeting young larvae', 'Use synthetic pyrethroids for heavy infestations', 'Rotate with diamide insecticides to prevent resistance', 'Use pheromone-baited traps for early detection'],
    prevention: ['Monitor fields weekly with pheromone traps', 'Practice crop rotation with non-host crops', 'Destroy crop residues immediately after harvest', 'Avoid broad-spectrum pesticides to preserve natural enemies'],
    imageUrl: tobaccoBudwormImg,
    severity: 'High',
    cropsAffected: ['Tobacco', 'Cotton', 'Tomato', 'Soya beans'],
  },
  {
    id: '19',
    name: 'Tsetse Fly',
    scientificName: 'Glossina spp.',
    description: 'Blood-sucking flies that transmit Trypanosomiasis to livestock and humans, severely limiting farming and livestock keeping in affected areas of Zimbabwe.',
    symptoms: ['Livestock showing weakness and anaemia', 'Reduced milk and meat production', 'Animals with swollen lymph nodes', 'High mortality in untreated cattle'],
    treatment: ['Treat livestock with trypanocidal drugs', 'Use insecticide-treated livestock (pour-on)', 'Deploy odour-baited traps and targets', 'Aerial or ground spraying in hotspot areas'],
    prevention: ['Clear bush around homesteads and fields', 'Avoid taking livestock into high-risk areas', 'Use insecticide-impregnated traps and screens', 'Report outbreaks to veterinary authorities immediately'],
    imageUrl: tsetseFlyImg,
    severity: 'Critical',
    cropsAffected: ['Livestock', 'Cattle', 'Goats', 'Humans (indirect)'],
  },
  {
    id: '20',
    name: 'Whitefly',
    scientificName: 'Bemisia tabaci',
    description: 'Tiny white-winged insects that feed on leaf undersides, transmit damaging plant viruses, and excrete honeydew that promotes sooty mould on crops.',
    symptoms: ['Clouds of white insects rising when plants disturbed', 'Yellowing and wilting of infested leaves', 'Sticky honeydew and sooty mould on leaves', 'Virus symptoms — mosaic, leaf curl, yellowing'],
    treatment: ['Apply imidacloprid or thiamethoxam systemic sprays', 'Use yellow sticky traps for mass trapping', 'Apply neem oil or insecticidal soap sprays', 'Introduce parasitic wasp Encarsia formosa'],
    prevention: ['Use virus-resistant crop varieties', 'Install fine mesh screens on seedbeds', 'Avoid water stress that makes plants more susceptible', 'Remove and burn virus-infected plant material'],
    imageUrl: whiteflyImg,
    severity: 'High',
    cropsAffected: ['Tomato', 'Cassava', 'Cotton', 'Tobacco'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityClass = (s: string): string => {
  switch (s) {
    case 'Critical': return 'high';
    case 'High':     return 'high';
    case 'Medium':   return 'medium';
    default:         return 'low';
  }
};

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect width='400' height='240' fill='%23c8e6d9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48'%3E🐛%3C/text%3E%3C/svg%3E";

// ─── Component ────────────────────────────────────────────────────────────────
const KnowledgeBase: React.FC = () => {
  const [selectedPest, setSelectedPest]     = useState<Pest | null>(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = PESTS.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.scientificName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeverity =
      severityFilter === 'all' ||
      p.severity.toLowerCase() === severityFilter.toLowerCase();
    return matchSearch && matchSeverity;
  });

  const criticalCount = PESTS.filter(p => p.severity === 'Critical').length;
  const totalCrops    = [...new Set(PESTS.flatMap(p => p.cropsAffected))].length;

  return (
    <div className="knowledge-base">

      {/* ── Header ── */}
      <div className="kb-header glass-card">
        <h1>🌿 Pest Knowledge Base</h1>
        <p>Learn to identify and manage common agricultural pests in Zimbabwe</p>
        <div className="kb-stats">
          <span>📚 {PESTS.length} Pest Profiles</span>
          <span>⚠️ {criticalCount} Critical Pests</span>
          <span>🌾 {totalCrops}+ Crops Affected</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="kb-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by pest name or scientific name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <label>Filter by severity:</label>
          <select
            className="severity-filter"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* ── Pest Grid ── */}
      {filtered.length === 0 ? (
        <div className="no-results">
          <span className="no-results-icon">🔍</span>
          <h3>No pests found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="pests-grid">
          {filtered.map(pest => (
            <div
              key={pest.id}
              className="pest-card glass-card"
              onClick={() => setSelectedPest(pest)}
            >
              <div className="pest-image-container">
                <img
                  src={pest.imageUrl}
                  alt={pest.name}
                  className="pest-image"
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                />
                <span className={`severity-badge ${severityClass(pest.severity)}`}>
                  {pest.severity}
                </span>
              </div>
              <div className="pest-info">
                <h3>{pest.name}</h3>
                <div className="scientific-name">{pest.scientificName}</div>
                <p className="pest-description">
                  {pest.description.substring(0, 100)}…
                </p>
                <div className="crops-affected">
                  <span className="crop-label">Affects:</span>
                  {pest.cropsAffected.slice(0, 3).map((crop, i) => (
                    <span key={i} className="crop-tag">{crop}</span>
                  ))}
                  {pest.cropsAffected.length > 3 && (
                    <span className="crop-tag">+{pest.cropsAffected.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedPest && (
        <div className="pest-detail-modal" onClick={() => setSelectedPest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedPest(null)}>✕</button>

            <div className="modal-header">
              <img
                src={selectedPest.imageUrl}
                alt={selectedPest.name}
                className="modal-image"
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
              <div className="modal-title">
                <h2>{selectedPest.name}</h2>
                <div className="scientific-name">{selectedPest.scientificName}</div>
                <div className={`severity-badge-large ${severityClass(selectedPest.severity)}`}>
                  Severity: {selectedPest.severity}
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h3>📋 Overview</h3>
                <p>{selectedPest.description}</p>
              </div>
              <div className="info-section">
                <h3>⚠️ Symptoms</h3>
                <ul>{selectedPest.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="info-section">
                <h3>💊 Treatment</h3>
                <ul>{selectedPest.treatment.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
              <div className="info-section">
                <h3>🛡️ Prevention</h3>
                <ul>{selectedPest.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div className="info-section">
                <h3>🌾 Affected Crops</h3>
                <div className="crops-list">
                  {selectedPest.cropsAffected.map((c, i) => (
                    <span key={i} className="crop-badge">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;