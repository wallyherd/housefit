# HouseFit — TODO

## Cardápio público fiel ao catálogo de referência

- [ ] A página pública deve exibir combos promocionais, refeições de frango, refeições de carne, caldos, lanches e sucos congelados.
- [ ] Cada produto deve apresentar nome, descrição, preço, disponibilidade e controle de quantidade.
- [ ] O cliente deve conseguir pesquisar, filtrar por categoria, adicionar produtos, revisar o carrinho e confirmar um pedido demonstrativo.
- [ ] A interface deve ser responsiva, com prioridade para uso em celular.

## Pedidos e operação

- [ ] O admin deve visualizar pedidos recentes, cliente, itens, valor, canal, pagamento e status.
- [ ] O admin deve conseguir atualizar o status do pedido entre recebido, preparando, pronto, em entrega e concluído.
- [ ] O sistema deve exibir contagem de pedidos por status e destaque para pedidos que exigem atenção.

## Produtos, custos e estoque

- [ ] O admin deve visualizar produtos, categoria, preço, custo, margem e quantidade em estoque.
- [ ] O admin deve conseguir alterar disponibilidade e sinalizar estoque baixo.
- [ ] O sistema deve manter a estrutura de movimentações de estoque para entradas, saídas e ajustes.

## Financeiro, relatórios e insights

- [ ] O admin deve visualizar faturamento, ticket médio, pedidos e margem estimada.
- [ ] O admin deve visualizar gráficos de vendas semanais e mensais.
- [ ] O admin deve visualizar os produtos e dias com maior saída.
- [ ] O admin deve visualizar clientes mais frequentes e gasto acumulado.
- [ ] O admin deve receber insights estratégicos derivados dos dados demonstrativos.

## Base persistível

- [ ] O schema deve suportar produtos, pedidos, itens de pedido, clientes e movimentos de estoque.
- [ ] As procedures tRPC devem separar catálogo público de operações administrativas.
- [ ] A rota `/manus-routes.json` deve listar `/` e `/admin`.

## Validação e entrega

- [ ] `pnpm check` deve passar sem erros.
- [ ] `pnpm build` deve produzir o frontend e o bundle do servidor.
- [ ] O servidor deve responder em `/api/health` e `/manus-routes.json`.
