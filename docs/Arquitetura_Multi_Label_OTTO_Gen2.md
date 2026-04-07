# Arquitetura Multi-Label em Visão Computacional Médica: OTTO Gen 2.0

**Pesquisador Principal:** Dr. Dario Hart 
**Status:** Planejamento Estratégico (Roadmap)

## 1. O Paradoxo do "Diagnóstico Único" (Single-Label)
Até a Geração 1.0, o **OTTO Atlas (OTOSCOP-IA)** foi projetado sobre a base de redes Neurais PyTorch (ResNet18) fundamentadas na função de perda `CrossEntropyLoss`. 

**A Matemática Atual:**
Nessa fundação, a Última Camada (*Layer*) da rede neural utiliza uma função *Softmax*. A matemática do *Softmax* "espreme" as probabilidades de diagnóstico para que a soma de todas as classes resulte exatamente em 100%. 
*Exemplo prático:* Se a rede vê uma retração severa do tímpano (OMC) junto de Cerume, ela é forçada a "escolher um vencedor", dividindo: `Cerume 55%, OMC 40%, Normal 5%`.

**O Problema Clínico:** 
O ouvido não opera em sistemas excludentes. Um paciente pode carregar *Tímpanoescledose* (Normal/Histórico) E *Otite Média Serosa* (Agudo) E pequena quantidade de *Cerume* (Fator anatômico) simultaneamente. Obrigar a IA a escolher um único diagnóstico fere a semiologia do mundo real, gerando relatórios de "Falso-Negativo" para achados secundários.

## 2. A Evolução: Multi-Label Classification (Gen 2.0)
Para romper essa amarra, a documentação para a próxima base algorítmica exige as seguintes alterações do núcleo MLOps:

### 2.1 Pytorch Kernel: BCEWithLogitsLoss
Ao invés do *Softmax* + *CrossEntropy*, o núcleo de inferência da camada de predição passará para `BCEWithLogitsLoss` (Binary Cross Entropy). 
Neste formato, *cada classe* ganha uma válvula independente avaliada por uma curva *Sigmoid*.
*Exemplo da Gen 2.0:* `[Cerume: 90%] | [Tímpanoesclerose: 85%] | [Corpo Estranho: 2%]`. A soma **não** precisa ser 100%. A IA identifica e grita sobre TODOS os achados que cruzarem a margem técnica de confiança (>50%).

### 2.2 Estrutura do Novo Dataset (CSV Mapping)
A transição mais cara não é computacional, mas braçal.
Hoje o OTTO_ML_Dataset organiza fotos dentro de pastas (`/cerume_obstrucao`, `/otite_media_aguda`), o que inerentemente dita que "1 foto só tem 1 patologia (a pasta dela)".
Para o *Multi-Label*, o script de Triagem (Sincronizador) utilizará um arquivo `metadata.csv` na raiz do Dataset:

```csv
image_name          | labels
foto_1.jpg          | cerume_obstrucao, membrana_normal
foto_2.jpg          | otite_media_serosa, tubo_de_ventilacao
foto_3.jpg          | otite_externa_aguda
```

### 2.3 Frontend Dinâmico
A tela do OTTOscop-IA precisará ser levemente refatorada. Ao invés do bloco "Diagnóstico Primário" com alta densidade hierárquica, a IU (Interface de Usuário) exibirá as *Tags* simultâneas iluminadas em verde e listadas em formato de pílulas.

## 3. Conclusão da Trilha de Viabilidade
O escopo acima garante salto tecnológico massivo (uma *Segunda Opinião Holística*). É recomendado iniciar esta transição em uma filial *sandbox* do projeto após atingirmos N=200 imagens confirmadas em classes compostas através da atual rotina de Colaboratório.
