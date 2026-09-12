# Dieta pelo perfil e conexão Apple Saúde

## Objetivo
Usar dados pessoais reais no cálculo energético da dieta e preparar o NATIVO para receber automaticamente dados autorizados do Apple Saúde, sem criar medições fictícias ou apagar histórico.

## Implementação
1. **Perfil metabólico**
   - Completar o perfil com data de nascimento e sexo usado no cálculo metabólico.
   - Manter peso, altura, nível de atividade e objetivo já salvos.
   - Exibir claramente quais dados ainda faltam antes de gerar um plano.

2. **Cálculo da dieta**
   - Calcular a necessidade diária a partir do perfil salvo, com fórmula metabólica reconhecida, fator de atividade e ajuste moderado pelo objetivo.
   - Enviar à IA a meta calculada, a fórmula aplicada e os dados reais do perfil.
   - Validar a soma das refeições e mostrar calorias como estimativas, nunca como prescrição médica.
   - Salvar no plano a meta e os parâmetros usados, preservando planos e refeições anteriores.

3. **Base segura para Apple Saúde**
   - Criar registros privados de conexões e amostras de saúde, isolados por conta.
   - Aceitar passos, sono, frequência cardíaca, glicemia e pressão apenas com origem, horário, unidade e identificador contra duplicação.
   - Preparar uma entrada autenticada para sincronização por um aplicativo companheiro no iPhone.

4. **Experiência de conexão**
   - Adicionar ao Corpo uma área “Apple Saúde” com estado de conexão, última sincronização e métricas importadas.
   - Não oferecer lançamento manual, conforme solicitado.
   - Explicar que a autorização do Apple Saúde exige um aplicativo iOS companheiro; o site sozinho não consegue abrir o HealthKit.
   - Não afirmar que o Apple Watch mede glicemia ou pressão: exibir esses números somente quando vierem de aparelhos compatíveis sincronizados ao Apple Saúde.

5. **Score e recomendações**
   - Incorporar apenas amostras recentes, válidas e com origem identificada.
   - Usar passos e sono no score; manter glicemia e pressão como contexto de saúde, sem premiar, punir, diagnosticar ou sugerir mudança de tratamento.
   - Mostrar fonte e horário de cada leitura e orientar avaliação profissional diante de valores preocupantes.

6. **Verificação**
   - Testar perfil incompleto/completo, diferentes níveis de atividade, geração e troca de plano.
   - Testar conta sem conexão, sincronização, duplicatas, dados antigos e isolamento entre usuários.
   - Validar celular e computador, build e falhas de integração.

## Limite da primeira entrega
A aplicação web e o banco ficarão prontos para a sincronização automática. A leitura efetiva do Apple Saúde depende de um aplicativo iOS assinado e distribuído, pois a Apple não expõe o HealthKit diretamente para sites.
