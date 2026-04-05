export type QuizQuestion = {
  id: string;
  clinicalCase: string; // "Paciente de 4 anos com otalgia à direita, febre..."
  image: string; // "/images/atlas/oma.jpg"
  options: string[]; // ["OMA", "OEA", "Colesteatoma", "Normal"]
  correctOptionIndex: number;
  explanation: string;
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    clinicalCase: 'Mãe traz lactente de 14 meses à emergência com queixa de febre (39°C), recusa alimentar e irritabilidade intensa que piora ao deitar. Constatou manipulação frequente da orelha direita nas últimas 48 horas. Exame físico sem alterações no pavilhão e mastoide. Qual a alteração otoscópica mais provável e o diagnóstico?',
    image: '/images/atlas_v3/Otite_M_dia_Aguda___Bacteriana_1.jpg',
    options: ['Opacificação amarelada sem eritema - Otite Média Serosa', 'Abaulamento severo com apagamento dos marcos anatômicos - OMA Bacteriana', 'Edema difuso do conduto auditivo obliterando visão - OEA Difusa', 'Retração com bolsa colesteatomatosa no ático - OMC Colesteatomatosa'],
    correctOptionIndex: 1,
    explanation: 'A tríade clássica infantil de instalação rápida (febre, irritabilidade, agitação ao deitar) combinada com a imagem efusiva severamente abaulada sob tensão consolida uma Otite Média Aguda Bacteriana clássica.'
  },
  {
    id: 'q2',
    clinicalCase: 'Homem de 22 anos, surfista amador de verão, refere prurido implacável no ouvido esquerdo há 3 dias. Hoje evoluiu para otalgia excruciante agravada com a mastigação. Relata que "mal consegue encostar na orelha".',
    image: '/images/atlas_v3/Otite_Externa_Aguda___Difusa_1.jpg',
    options: ['Plenitude por Cerume Impactado', 'Otite Externa Aguda Difusa ("Otite de Nadador")', 'Otite Média Aguda Viral', 'Timpanoesclerose Grave'],
    correctOptionIndex: 1,
    explanation: 'Sinal do Tragus positivo associado a dor na mastigação e oclusão do conduto por edema profundo difuso é patognomônico de OEA (Pseudomonas/Staphylococcus).'
  },
  {
    id: 'q3',
    clinicalCase: 'Paciente mulher, de 45 anos, professora, chega ao ambulatório referindo "zumbido latejante e surdez contínua" no lado esquerdo acompanhado de coceira terrível mas sem dor grave. Nega episódios gripais. Moradora recente do norte do país (ambiente úmido).',
    image: '/images/atlas_v3/Otite_Externa_F_ngica_1.jpg',
    options: ['Otite Média Crônica Supurativa', 'Rolha Epidérmica', 'Corpo Estranho Inseto', 'Otomicose (Otite Externa Fúngica)'],
    correctOptionIndex: 3,
    explanation: 'Prurido intenso, clima tropical/úmido (exacerba fungos) e a clássica visualização em "borra de café" ou algodoada (hifas de Aspergillus niger ou Candida) define o quadro fúngico puro.'
  },
  {
    id: 'q4',
    clinicalCase: 'Senhor de 68 anos vem com queixa audiológica. Refere perda auditiva leve, acompanhada de secreção aquosa-mucinosa fétida e indolor que retorna por meses a fio no ouvido direito. Ao exame, relata ter tido inúmeros quadros secretivos mal tratados durante sua infância no interior rural.',
    image: '/images/atlas_v3/Otite_M_dia_Cr_nica___Simples_1.jpg',
    options: ['Perfuração Central - Otite Média Crônica Simples', 'Perda Neurossensorial Isquêmica', 'Cerume Impactado Profundo', 'Otite Média Aguda Tardia'],
    correctOptionIndex: 0,
    explanation: 'Histórico prolongado crônico sem dores agudas atuais, acompanhado de otorreia intermitente na fase adulta resultante de injúrias infantis apontam para OMC simples (perfuração timpânica crônica).'
  },
  {
    id: 'q5',
    clinicalCase: 'Criança de 7 anos levada ao pronto-socorro referindo audição abafada, desconforto e sensação de ruído áspero de fricção no ouvido ao mastigar. Mãe relata que acabaram de retornar das férias, onde o menino passou dias brincando de se enterrar nas dunas da praia.',
    image: '/images/atlas_v3/Corpo_Estranho_1.jpg',
    options: ['Otomicose Fúngica', 'Obstrução / Corpo Estranho (Areia Retida)', 'Condrite Friccional', 'Rolha de Cerúmen Fisiológica'],
    correctOptionIndex: 1,
    explanation: 'A visualização direta de múltiplos grânulos cristalinos aglomerados no conduto auditivo, intimamente associada ao histórico de exposição à praia, confirma a impactação do canal por corpos estranhos inorgânicos (areia).'
  },
  {
    id: 'q6',
    clinicalCase: 'Homem jovem no pronto-atendimento refere dor intensa focalíssima na entrada do conduto. Relata que, irritado com uma coceira leve, coçou o ouvido com a chave do carro anteontem, gerando um pequeno trauma. Hoje queixa-se de um "caroço crescendo" latejante na cartilagem.',
    image: '/images/atlas_v3/Otite_Externa_Localizada_3.jpg',
    options: ['Condrite Auto-Imune', 'Miringite Bolhosa', 'Furunculose Traumato-Infecciosa (OEA Localizada)', 'Mastoidite'],
    correctOptionIndex: 2,
    explanation: 'A quebra da barreira epitelial por trauma (chave, unhas, palitos) é o clássico precedente da infecção secundária por S. Aureus, que invade o folículo piloso gerando um abscesso circunscrito (foto 3) no terço externo cartilaginoso.'
  },
  {
    id: 'q7',
    clinicalCase: 'Criança de 6 anos com história pregressa de múltiplas otites e já submetida a inserção prévia de tubos de ventilação, realiza exame admissional pediátrico por fonoaudiologia normal. Sem queixas sistêmicas atuais. Tímpano demonstra placas rígidas brancas no formato arciforme (meia lua).',
    image: '/images/atlas_v3/Timpanoesclerose_1.jpg',
    options: ['Otite Media Aguda Purulenta Subjacente', 'Agenesia Ossicular', 'Timpanoesclerose (Calcificação Hialina Cônica)', 'Tímpano Normal Desprovido de Doença Pretérita'],
    correctOptionIndex: 2,
    explanation: 'Placas alvas assintomáticas sob a lâmina própria da membrana, comuns em portadores pós-resolução de processos inflamatórios massivos infantis, constituem o quadro cicatricial de Timpanoesclerose.'
  },
  {
    id: 'q8',
    clinicalCase: 'Adolescente, após 3 dias de coriza leve e espirros (quadro gripal claro de inverno), inicia relato de "ouvido oco / estalando" e eritema vascular superficial no tímpano, mas a mobilidade e as proeminências de cabos do martelo seguem localizados.',
    image: '/images/atlas_v3/Otite_M_dia_Aguda___Viral_ou_Inicial_1.jpg',
    options: ['Corpo Estranho Inflingido', 'Otite Externa Pura', 'Otite Média Aguda (Fase Serosa/Viral/Inicial)', 'Colesteatoma Inicial'],
    correctOptionIndex: 2,
    explanation: 'Em fases virais prodrômicas do rinovírus, a tuba auditiva reage alterando pressões e promovendo injeção vascular sem causar necessariamente acúmulo supurativo e abaulamento instantâneo, diagnosticando OMA Inicial ou Serosa.'
  },
  {
    id: 'q9',
    clinicalCase: 'Jovem adulto no terceiro dia ininterrupto do uso severo de gotas otológicas prescritas erradamente na drogaria para um problema que evoluiu progressivamente gerando supuração espessa e abundante no conduto inteiro não relacionada aos hábitos aquáticos, porém escorrendo por perfuração timpânica subjacente em crise.',
    image: '/images/atlas_v3/Otite_M_dia_Aguda_SupurativaSupurada_1.jpg',
    options: ['Exostoses', 'Otomicose Isolada', 'Otite Média Crônica Em Remissão', 'Otite Média Crônica Supurativa / OMA Supurada Perfurada'],
    correctOptionIndex: 3,
    explanation: 'Uma fase extrema na qual a membrana literalmente cede tensão, causando ruptura espontânea em uma infecção ativa, com efusionamento massivo desaguando na concha auditiva formando o quadro clínico de otorreia perfurada.'
  },
  {
    id: 'q10',
    clinicalCase: 'No posto médico de aviação comercial, copiloto assintomático, realizou audiometria rigorosamente normal (0dB quadros). Apresenta a visualização otoscópica diáfana presente em sua ficha técnica laboral.',
    image: '/images/atlas_v3/Normal_1.jpg',
    options: ['Perfuração Atrofiada Marginal', 'Miringoesclerose Focais', 'Tímpano Normal Típico / Padrão-Ouro', 'Otite Barotrauma Grau 1'],
    correctOptionIndex: 2,
    explanation: 'Visualizar o famoso "polígono de luz", a transparência translúcida sem efusão líquida, atesta a conformidade total anatômica de ouvido médio e orelha externa.'
  }
];
