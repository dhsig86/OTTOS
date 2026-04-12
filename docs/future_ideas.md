# Ideias e Projetos Futuros (Backlog de Arquitetura)

Este documento centraliza conceitos brilhantes e de alta complexidade para as próximas fases evolutivas do ecossistema OTTO, garantindo que o acoplamento seja feito apenas quando o volume de dados e o momento clínico permitirem.

---

## 1. Motores Neurais em Cascata (Classificadores de Subgrupos)
*Proposto em: Abril de 2026*

**O Problema Atual:**
Se tentarmos prever todas as minúcias diagnósticas em um único modelo Fast.ai (ex: *Otite Média Aguda Viral*, *Otite Média Crônica Colesteatomatosa*, *Otite Externa Fúngica*), a matemática diluirá a acurácia. Precisaríamos de dezenas de milhares de fotos perfeitamente iluminadas para manter a confiança.

**A Solução (Arquitetura Branching/Cascata):**
Desenvolver um "Pipeline de Dois Estágios" (Motores de 1ª e 2ª Ordem).

1. **Motor Primário (Generalista - "The Sorter"):**
   - Classes grossas: `Normal`, `Otite Média`, `Otite Externa`, `Cerume`, `Corpo Estranho`, `Tímpano Perfurado`.
   - Se ele bate *Otite Externa* com 95% de confiança, a imagem desce para a esteira do Motor 2A.
   - Se bate *Otite Média*, desce para o Motor 2B.

2. **Motores Secundários (Especialistas Niche):**
   - **Motor 2A (Especialista em Otite Externa):** Tenta dividir a probabilidade entre *Aguda Localizada*, *Aguda Difusa*, *Otomicose*, *Descamativa*.
   - **Motor 2B (Especialista em Otite Média):** Tenta dividir entre *Aguda Viral*, *Crônica Simples*, *Crônica Supurada*, *Colesteatomatosa*.

**Por que adiar?**
Essa ramificação só deve ser iniciada e exposta no Frontend como "Beta/Ajude-nos a Treinar" depois que a comunidade prover um acervo robusto (ex: pelo menos 100 fotos perfeitamente catalogadas de cada subgrupo). Uma abordagem precoce fragmentaria a base.

---

## 2. Normalizador Inteligente RegEx (Active Matching)
Para evitar que parceiros salvem `otite média` e `Otite Media` criando pastas divergentes, o Backend deve possuir listas de sinônimos pesados e varredura RegEx para unificar o vocabulário, ou permitir que o App bloqueie free-text sugerindo Selects da CID-10 e guidelines.

---

## 3. Reconhecimento de Padrões e Módulo Real-Time (Hardware Chinês)
*Proposto nas sprints de estabilização estrutural*

**Ideia Central:**
Evoluir o aspecto do Atlas e do Quiz introduzindo pipelines de inferência por Ensemble Learning, inspirando-se em metodologias provadas de visão computacional na otorrino:
1. **Sumotosima**: Implementar um framework focado em reconhecimento restrito de padrões otoscópicos clássicos.
2. **Identificação Ensemble/Real-Time (Paper: Efficient and accurate identification of ear diseases using an ensemble deep learning model)**: 
   - Quebrar a limitação da foto "estática".
   - Criar uma ponte no Frontend que conecte com a câmera do Windows (periférico USB).
   - Acoplar o provedor diretamente a *otoscópios digitais chineses* de baixo custo.
   - O aplicativo faria tracking ativo (Real-time feed) identificando e plotando as porcentagens das doenças no vídeo ao vivo. Isso transforma um otoscópio barato em uma ferramenta premium de AI edge computing.
