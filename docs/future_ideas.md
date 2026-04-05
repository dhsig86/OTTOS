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
