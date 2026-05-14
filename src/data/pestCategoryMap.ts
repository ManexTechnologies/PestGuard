export const PEST_CATEGORY_MAP: Record<
  string,
  { pestType: string; reasoning: string }
> = {
  // Lepidoptera (moths/butterflies)
  'fall armyworm': {
    pestType: 'lepidoptera',
    reasoning: 'Destructive caterpillar pest of maize and cereals',
  },
  'cotton bollworm': {
    pestType: 'lepidoptera',
    reasoning: 'Major pest of cotton bolls and other fruits',
  },
  'tobacco budworm': {
    pestType: 'lepidoptera',
    reasoning: 'Caterpillar pest affecting tobacco and vegetables',
  },
  'stalk borer': {
    pestType: 'lepidoptera',
    reasoning: 'Larvae bore into stems causing dead hearts',
  },
  'diamondback moth': {
    pestType: 'lepidoptera',
    reasoning: 'Pest of brassica vegetables',
  },
  'grain moth': {
    pestType: 'lepidoptera',
    reasoning: 'Storage pest of cereals',
  },
  'stem borer': {
    pestType: 'lepidoptera',
    reasoning: 'Sugarcane stem borer significantly damaging',
  },

  // Coleoptera (beetles)
  'maize weevil': {
    pestType: 'coleoptera',
    reasoning: 'Most destructive storage pest of maize',
  },
  'african bollworm': {
    pestType: 'coleoptera',
    reasoning: 'Major cotton and vegetable pest',
  },

  // Hemiptera (true bugs/aphids)
  aphids: {
    pestType: 'hemiptera',
    reasoning: 'Sap-sucking pest causing stunting and disease transmission',
  },
  'bean aphid': {
    pestType: 'hemiptera',
    reasoning: 'Green aphid on legume crops',
  },
  whitefly: {
    pestType: 'hemiptera',
    reasoning: 'Sap-sucking pest transmitting plant viruses',
  },
  'cotton stainer': {
    pestType: 'hemiptera',
    reasoning: 'Stains cotton lint reducing quality',
  },

  // Acarina (mites)
  'red spider mite': {
    pestType: 'arachnida',
    reasoning: 'Mite causing severe leaf damage in hot conditions',
  },

  // Orthoptera (locusts/grasshoppers)
  locust: {
    pestType: 'orthoptera',
    reasoning: 'Migratory pest causing massive crop devastation',
  },
  'quelea birds': {
    pestType: 'aves',
    reasoning: 'Grain-eating birds causing crop loss',
  },

  // Diptera (flies)
  'fruit fly': {
    pestType: 'diptera',
    reasoning: 'Pest of citrus and other fruits',
  },
  'tsetse fly': {
    pestType: 'diptera',
    reasoning: 'Blood-feeding fly affecting livestock',
  },

  // Other pests
  cutworm: {
    pestType: 'lepidoptera',
    reasoning: 'Nocturnal caterpillar cutting seedlings at soil level',
  },
  'leaf miner': {
    pestType: 'diptera',
    reasoning: 'Larvae mine between leaf surfaces',
  },
  thrips: {
    pestType: 'thysanoptera',
    reasoning: 'Tiny insects rasping leaf surfaces',
  },
  termites: {
    pestType: 'isoptera',
    reasoning: 'Subterranean insects attacking crop roots',
  },

  // Diseases
  'maize streak virus': {
    pestType: 'virus',
    reasoning: 'Viral disease causing yellow streaks',
  },
  'grey leaf spot': {
    pestType: 'fungus',
    reasoning: 'Fungal disease of maize leaves',
  },
  'root knot nematode': {
    pestType: 'nematode',
    reasoning: 'Root parasites causing galls and stunting',
  },
  'tomato blight': {
    pestType: 'fungus',
    reasoning: 'Destructive fungal disease of tomato and potato',
  },
  'cassava mosaic disease': {
    pestType: 'virus',
    reasoning: 'Viral disease of cassava',
  },
  'groundnut rosette': {
    pestType: 'virus',
    reasoning: 'Viral disease causing severe stunting',
  },
  'sugarcane aphid': {
    pestType: 'hemiptera',
    reasoning: 'Yellow aphid on sugarcane',
  },
  'wheat stem rust': {
    pestType: 'fungus',
    reasoning: 'Destructive fungal disease of wheat',
  },

  // Other
  'banana weevil': {
    pestType: 'coleoptera',
    reasoning: 'Beetle pest of banana plants',
  },
};

