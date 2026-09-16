# Notificações da Comunidade

## Objetivo
Adicionar notificações dentro da Comunidade quando outra pessoa publicar uma mensagem ou responder a uma publicação do usuário.

## Entrega
- Criar notificações privadas e persistentes para cada pessoa.
- Gerar um aviso de nova publicação para os demais participantes.
- Gerar um aviso quando alguém responder a uma publicação do usuário.
- Mostrar contador de não lidas no item Comunidade da navegação.
- Adicionar um sino na página Comunidade com lista, estados vazio/erro e ação para marcar como lidas.
- Atualizar os avisos automaticamente enquanto o aplicativo estiver aberto.

## Detalhes técnicos
- Tabela protegida por usuário, com regras para leitura e atualização somente do destinatário.
- Geração automática dos eventos no banco, sem depender de o remetente manter a tela aberta.
- Assinatura em tempo real criada uma vez e removida ao sair da tela.
- Links dos avisos levam à publicação correspondente na Comunidade.
- Validação em desktop e celular, incluindo contador, lista e leitura.
