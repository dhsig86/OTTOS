export type SvgHotspot = {
  id: string;
  label: string;
  path: string; // Coordinate path string
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
    hotspots: [
      [
        {
          id: "spot_1775294939053",
          label: "Cone de Luz",
          path: "M 326,494 L 133,540 L 165,673 L 326,492 Z"
        }
      ]
    ],
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
    hotspots: [
      [
        {
          id: "spot_1775267450400",
          label: "Supuração da orelha média/Otorréia",
          path: "M 261,673 L 208,778 L 267,872 L 432,853 L 462,788 L 450,735 L 407,656 L 263,668 Z"
        },
        {
          id: "spot_1775267545559",
          label: 'Processo lateral do martelo hiperemiado e "apagado" pelo abaulamento',
          path: "M 275,356 L 196,191 L 139,195 L 106,236 L 113,284 L 271,500 L 342,524 L 285,358 Z"
        }
      ]
    ],
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
    hotspots: [
      [
        {
          id: "spot_1775266187793",
          label: "Cone de Luz",
          path: "M 588,778 L 562,673 L 681,693 L 594,782 Z"
        },
        {
          id: "spot_1775266919222",
          label: "Pars Flácida",
          path: "M 306,522 L 484,244 L 775,238 L 326,549 L 304,532 Z"
        },
        {
          id: "spot_1775266992903",
          label: "Bolha/ Efusão na Orelha Média",
          path: "M 560,449 L 454,538 L 421,642 L 482,642 L 537,599 L 578,559 L 582,479 L 562,447 Z"
        }
      ]
    ],
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
    hotspots: [
      [
        {
          id: "spot_1775470520331",
          label: "Perfuração Timpânica",
          path: "M 254,615 L 254,702 L 313,718 L 355,676 L 347,640 L 311,607 L 256,607 Z"
        },
        {
          id: "spot_1775470555471",
          label: "Secreção Bolhosa/Otorréia da Orelha média",
          path: "M 137,789 L 226,846 L 301,850 L 372,931 L 196,880 L 133,789 Z"
        }
      ]
    ],
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
    hotspots: [
      [
        {
          id: "spot_1775295465212",
          label: "Micélio Algodonoso / Hifas Fúngicas",
          path: "M 261,581 L 236,770 L 523,581 L 501,402 L 643,390 L 698,262 L 643,126 L 578,122 L 391,291 L 255,520 L 249,579 Z"
        }
      ]
    ],
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
