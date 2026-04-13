# Auditoria estrutural do conhecimento_otto.json
## Achados críticos
1. **Versionamento global inconsistente**: `metadata.schema_version` = `4.0`, enquanto `rag_schema_v4.versao` = `4.1`.
2. **Q_OBSTRUCAO_NASAL fora do padrão v4.1**: sem `meta`, sem `relacionamentos`, sem `max_perguntas_por_turno` em `triagem.controle_complexidade`, e `cdss.scoring` sem `versao` e `objetivo`.
3. **Q_LESOES_ORAIS fora do padrão v4.1**: `meta` contém apenas `versao_conteudo`, sem `macroarea_principal`, `tipo` e `status`; `triagem` usa formato diferente (ex.: `turnos_maximos`) e não tem `controle_complexidade`; `cdss.scoring` sem `objetivo`.
4. **Q_RONCO_SONO fora do padrão v4.1**: `id` não está no topo do nó, está dentro de `meta`; falta `titulo` no topo; `meta` usa `macroarea` em vez de `macroarea_principal`; `triagem` não tem `controle_complexidade`; `cdss.scoring` sem `objetivo`; macroárea `sono` nem existe nas macroáreas globais.
5. **Macroárea inválida em Q_FACIALGIA**: usa `face` como `macroarea_principal` e `area_foco_inicial`, mas a ontologia global só declara `ouvido`, `nariz`, `garganta` e `pescoco`.
6. **Thresholds conflitantes em Q_OTALGIA**: `triagem.zonas_decisao_SS.variaveis` e `cdss.scoring.zonas_decisao_SS.variaveis` definem limiares A/B como 10/6 e 5/2, mas as strings decisórias ativas usam `SS1 >= 11 e DELTA >= 3` e `SS1 entre 8 e 10...`.
7. **Thresholds claramente incoerentes em Q_RINORREIA**: `variaveis` dizem `limiar_A_SS1=2`, `limiar_A_delta=0`, `limiar_B_SS1=1`, `limiar_B_delta=0`, mas as strings ativas pedem `SS1 >= 8 e DELTA >= 3` e `SS1 entre 5 e 7`. Isso inviabiliza a própria calibração descrita no nó.
8. **Ancoragem bayesiana incompleta em Q_OTALGIA**: 6 hipóteses ainda não têm `probabilidade_base`, contrariando a narrativa de ancoragem prevalencial generalizada.

## Achados moderados
1. **Divergência de versão top-level vs meta** em `Q_ODINOFAGIA`, `Q_DISFAGIA` e `Q_DISFONIA` (`versao_conteudo` 1.1 no topo e 1.0 dentro de `meta`).
2. **Mistura de dialetos de schema**: alguns nós usam contrato mais novo com `patient_output`, `referencias_anchor`, `probabilidade_base`, `zonas_decisao_SS`; outros mantêm estrutura antiga ou híbrida.
3. **Patches chamados de cirúrgicos parecem ter virado refatoração arquitetural parcial**: há nós plenamente padronizados e outros parcialmente migrados, sinal de migração incompleta e não apenas ajuste pontual.

## Síntese
O arquivo **não está homogêneo**. Há um núcleo forte e vários nós bons, mas o RAG atual ainda mistura pelo menos **três estados de maturidade**: nós v4.1 maduros, nós híbridos e nós parcialmente fora do contrato. Portanto, a narrativa de 'base 100% blindada e uniforme' **não se sustenta integralmente** ao inspecionar o JSON real.
