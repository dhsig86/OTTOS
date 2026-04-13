# Estratégia de Migração: FastAI/PyTorch para ONNX Runtime

Este documento descreve as decisões arquiteturais adotadas no **OTTO Clinical Atlas** para viabilizar um sistema de Inteligência Artificial de baixíssimo custo de nuvem, sem perda de acurácia clínica.

## 1. O Problema (OOM - Out of Memory)
Durante o deploy da arquitetura ResNet18 gerada pelo *Fast.ai* (PyTorch), o servidor gratuito do Render (512 MB de RAM) apresentava falha fatal no momento da carga (`load_learner`). O desempacotamento de pesos neurais `.pkl` exige picos de memória em torno de 700 MB, estourando rapidamente as limitações de nuvem gratuita e derrubando a API (Erro `502 Bad Gateway`).

## 2. A Solução: Padrão ONNX (Open Neural Network Exchange)
O ONNX é um formato padronizado que traduz as "entranhas" do PyTorch para uma matriz computacional brutalmente destilada, feita para inferência pura em C++. 
Ao converter o modelo para `.onnx`, o peso em RAM cai impressionantes **90%** (de 700MB para menos de 80MB).

## 3. O Fluxo de Treinamento Dividido (O Mais Importante)
A nuvem perdeu o FastAI e o PyTorch. Portanto, a Nuvem (Vercel/Render) virou uma máquina de pura leitura (Inferência). Todo o MLOps ativo pertence à sua Máquina Local (Windows).

### O Ciclo Completo de Atualização da Inteligência
Sempre que você revisar imagens novas na sua Curadoria e quiser deixar a IA mais robusta, siga este fluxo cirúrgico:

1. **O Treino Bruto:** Rode no seu computador o script `python ml_pipeline/train_model.py`. O seu PyTorch vai processar o `OTTO_ML_Dataset` e criar/atualizar um arquivão bruto chamado `otto_diagnostic_model.pkl`.
2. **A "Compressão" Automática:** Rode no seu terminal `python export_onnx.py`. Esse script vai fatiar o `.pkl` pesado, remover a infraestrutura redundante e cuspir um novíssimo `otto_model.onnx`.
3. **Deploy (Git):** Dê um `git push`. A nuvem vai baixar o `.onnx` novinho. Pronto, sua IA foi treinada e lançada para o Mundo sem gastar um centavo em servidores caros.

*E quanto à Curadoria?*
Para que as aprovações da Curadoria caiam magicamente nas pastas do seu Windows prontas pro treinamento, abra o site do React via `npm run dev` juntamente com o seu Backend Local (`python ml_pipeline/main.py`). Use a tela de "Curadoria" do seu PC para ditar o Ouro Padrão.
