export type SvgHotspot = {
  id: string;
  label: string;
  path: string; // Coordinate path string
  color?: string;
};

export type AtlasItem = {
  id: string;
  pathology: string;
  images: string[];
  description: string;
  hotspots?: SvgHotspot[][]; // Array de arrays, onde o índice corresponde à Imagem no Carrossel (0, 1 ou 2)
};

export const atlasData: AtlasItem[] = [
  {
    id: 'normal_01',
    pathology: 'Normal',
    images: [
      '/images/atlas_v3/Normal_1.jpg',
      '/images/atlas_v3/Normal_2.jpg',
      '/images/atlas_v3/Normal_3.jpg',
      '/images/atlas_v4/normal_v4_1.jpg',
      '/images/atlas_v4/normal_v4_2.jpg'
    ],
    hotspots: [],
    description: 'Membrana timpânica translúcida, íntegra, com marcos anatômicos visíveis (triângulo luminoso, punho do martelo). Padrão-ouro de comparação.'
  },
  {
    id: 'oma_bact',
    pathology: 'Otite Média Aguda Bacteriana',
    images: [
      '/images/atlas_v3/Otite_M_dia_Aguda___Bacteriana_1.jpg',
      '/images/atlas_v3/Otite_M_dia_Aguda___Bacteriana_2.jpg',
      '/images/atlas_v3/Otite_M_dia_Aguda___Bacteriana_3.jpg',
      '/images/atlas_v4/otite_media_aguda_v4_1.jpg',
      '/images/atlas_v4/otite_media_aguda_v4_2.jpg'
    ],
    hotspots: [],
    description: 'Abaulamento severo da membrana timpânica, hiperemia franca, efusão purulenta sob tensão e apagamento completo dos marcos anatômicos.'
  },
  {
    id: 'oma_viral',
    pathology: 'Otite Média Aguda Viral / Inicial',
    images: [
      '/images/atlas_v3/Otite_M_dia_Aguda___Viral_ou_Inicial_1.jpg',
      '/images/atlas_v3/Otite_M_dia_Aguda___Viral_ou_Inicial_2.jpg',
      '/images/atlas_v3/Otite_M_dia_Aguda___Viral_ou_Inicial_3.jpg'
    ],
    hotspots: [],
    description: 'Eritema leve a moderado (pode ser isolado ao martelo ou difuso), com vascularização evidente, frequentemente associado a quadros gripais.'
  },
  {
    id: 'omc_simples',
    pathology: 'Otite Média Crônica Simples',
    images: [
      '/images/atlas_v3/Otite_M_dia_Cr_nica___Simples_1.jpg',
      '/images/atlas_v3/Otite_M_dia_Cr_nica___Simples_2.jpg',
      '/images/atlas_v3/Otite_M_dia_Cr_nica___Simples_3.jpg',
      '/images/atlas_v4/otite_media_cronica_v4_1.jpg',
      '/images/atlas_v4/otite_media_cronica_v4_2.jpg'
    ],
    hotspots: [],
    description: 'Perfuração timpânica central ou marginal seca, não acompanhada de secreção ativa ou sinais agudos inflamatórios no momento.'
  },
  {
    id: 'omc_supurada',
    pathology: 'Otite Média Crônica Supurativa',
    images: [
      '/images/atlas_v3/Otite_M_dia_Aguda_SupurativaSupurada_1.jpg',
      '/images/atlas_v3/Otite_M_dia_Aguda_SupurativaSupurada_2.jpg',
      '/images/atlas_v3/Otite_M_dia_Aguda_SupurativaSupurada_3.jpg'
    ],
    description: 'Presença de perfuração timpânica crônica associada a otorreia ativa (secreção mucosa ou purulenta drenando no conduto).'
  },
  {
    id: 'timpanoesclerose',
    pathology: 'Timpanoesclerose',
    images: [
      '/images/atlas_v3/Timpanoesclerose_1.jpg',
      '/images/atlas_v3/Timpanoesclerose_2.jpg',
      '/images/atlas_v3/Timpanoesclerose_3.jpg'
    ],
    description: 'Depósitos de cálcio ou placas esbranquiçadas densas na camada média da membrana timpânica, muitas vezes sequela de otites de repetição.'
  },
  {
    id: 'oea_fungica',
    pathology: 'Otite Externa Fúngica (Otomicose)',
    images: [
      '/images/atlas_v3/Otite_Externa_F_ngica_1.jpg',
      '/images/atlas_v3/Otite_Externa_F_ngica_2.jpg',
      '/images/atlas_v3/Otite_Externa_F_ngica_3.jpg'
    ],
    hotspots: [],
    description: 'Presença de hifas escurecidas ou esbranquiçadas semelhantes a "algodão" forrando o conduto auditivo externo. Intenso prurido.'
  },
  {
    id: 'oea_local',
    pathology: 'Otite Externa Aguda Localizada',
    images: [
      '/images/atlas_v3/Otite_Externa_Localizada_1.jpg',
      '/images/atlas_v3/Otite_Externa_Localizada_2.jpg',
      '/images/atlas_v3/Otite_Externa_Localizada_3.jpg'
    ],
    description: 'Presença de furúnculo ou micro-abscesso localizado geralmente no terço externo cartilaginoso do canal. Dor intensa à manipulação.'
  },
  {
    id: 'oea_difusa',
    pathology: 'Otite Externa Aguda Difusa',
    images: [
      '/images/atlas_v3/Otite_Externa_Aguda___Difusa_1.jpg',
      '/images/atlas_v3/Otite_Externa_Aguda___Difusa_2.jpg',
      '/images/atlas_v3/Otite_Externa_Aguda___Difusa_3.jpg',
      '/images/atlas_v4/otite_externa_aguda_v4_1.jpg',
      '/images/atlas_v4/otite_externa_aguda_v4_2.jpg'
    ],
    description: 'Edema difuso inflamatório (inchado) do conduto auditivo, obliterando parcialmente ou totalmente a visão do tímpano.'
  },
  {
    id: 'corpo_estranho',
    pathology: 'Corpo Estranho / Obstrução',
    images: [
      '/images/atlas_v3/Corpo_Estranho_1.jpg',
      '/images/atlas_v3/Corpo_Estranho_2.jpg',
      '/images/atlas_v3/Corpo_Estranho_3.png',
      '/images/atlas_v4/cerume_obstrucao_v4_1.jpg',
      '/images/atlas_v4/cerume_obstrucao_v4_2.jpg'
    ],
    description: 'Elementos alheios ao corpo humano (insetos, algodão, massa de cerume impactada) bloqueando o canal auditivo.'
  }
];
