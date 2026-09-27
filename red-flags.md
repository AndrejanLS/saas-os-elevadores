# Red Flags: Pontos de Atenção em Competências

O texto abaixo analisa tarefas e competências comuns do dia a dia — descreve pontos de atenção para quem executa ou ensina essas habilidades.

1. **Cada consulta depende de credenciais locais para funcionar.**
   Ex.: <p>Essa ação requer trabalho motor fino e coordenação entre o olho e a mão.</p>
   *Cuidado:* isso pode ser difícil para quem tem pouca experiência. **Se não tomar cuidado, erra.**

2. **Muitos módulos compartilham as mesmas configurações globais.**
   Ex.: <p>Essa ação envolve baixo número de passos, mas precisa de força controlada para não quebrar nada.</p>
   *Atenção:* faça com calma e aperte só até o ponto em que a peça já não se move. **Não aplique força demais.**

3. **Recarregar a página pode restaurar um estado antigo.**
   Ex.: <p>Aqui o usuário precisa fazer operações mais abstratas, com menos rastreabilidade de estado.</p>
   *Atenção:* para quem tem que recarregar a tela durante o uso. **Valores desatualizados ao vivo.**

4. **Templates fixos predominam.**
   Ex.: <p>Blocos de interface muito parecidos se repetem em várias páginas.</p>
   *Observação:* pouco espaço para personalizar telas sem duplicar conteúdo. **Duplicação assim que se quer variar um tema.**

5. **Fluxos e regras são processados apenas no cliente.**
   Ex.: <p>Todo o processamento acontece no navegador antes do envio.</p>
   *Cuidado:* se o navegador travar, o rascunho da ordem pode ser perdido. **Rascunho é perdido.**

6. **Troca entre módulos depende de caminhos fixos.**
   Ex.: <p>Os links internos usam caminhos fixos e não variáveis.</p>
   *Atenção:* renomear uma rota exige atualizar várias páginas ao mesmo tempo. **Dívida técnica roteada.**

7. **Informações exibidas são repetidas em várias telas.**
   Ex.: <p>A mesma mensagem aparece no dashboard e na lista ao mesmo tempo.</p>
   *Cuidado:* dados podem mostrar valores diferentes em telas diferentes. **Inconsistência visível.**

8. **Campos obrigatórios com regras implícitas.**
   Ex.: <p>O campo de contato tem validação oculta no código.</p>
   *Observação:* se não souber o formato certo, o formulário recusa sem explicar bem. **Validação invisível trava o fluxo.**

9. **Relatórios gerados dependem de bibliotecas externas.**
   Ex.: <p>A geração do arquivo usa uma dependência externa.</p>
   *Atenção:* se a biblioteca cair ou mudar de versão, o relatório para de funcionar. **Ponto único de falha.**

10. **Notificações e feedback visual limitados.**
    Ex.: <p>Depois de salvar, não há uma mensagem clara de sucesso ou erro.</p>
    *Cuidado:* o usuário pode não perceber que a ação aconteceu — tentativas repetidas são comuns. **Sem feedback, a ação vira loteria.**
