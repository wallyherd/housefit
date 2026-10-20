# HouseFit — plano de implementação

## Escopo da primeira entrega

Construir uma aplicação web responsiva para a HouseFit com duas superfícies conectadas:

1. **Cardápio público** em `/`: experiência mobile-first inspirada na referência Fina Oliva, com banner, informação de funcionamento, busca, categorias horizontais, cards de produto, controles de quantidade, carrinho lateral e confirmação de pedido.
2. **Painel administrativo** em `/admin`: dashboard com KPIs, gráfico de vendas semanais/mensais, pedidos recentes com atualização de status, produtos com estoque e custo, clientes frequentes, relatórios e insights estratégicos.

A entrega inicial usa dados demonstrativos estruturados para permitir navegação e validação do produto. O schema Drizzle e as procedures tRPC deixam a base pronta para persistir pedidos, produtos, clientes, estoque e custos no banco gerenciado.

## Modelo de dados e integrações

- `users`: tabela do starter, preservada para autenticação Manus OAuth e papéis.
- `products`: nome, categoria, descrição, preço, custo, estoque, imagem, disponibilidade.
- `orders`: cliente, status, canal, subtotal, entrega, total, pagamento, data.
- `orderItems`: itens e quantidades do pedido.
- `customers`: nome, telefone, e-mail, total de pedidos, gasto total, última compra.
- `inventoryMovements`: entradas, saídas e ajustes com produto e quantidade.

O frontend começa com fallback local de demonstração para não bloquear a validação visual; as procedures `catalog`, `orders`, `customers` e `analytics` serão a camada de persistência para a próxima etapa.

## Direção visual

### Estilos considerados

- **Bistrô editorial saudável** (0,07): verde profundo, creme e laranja queimado, com tipografia de revista e cartões quentes.
- **Dashboard SaaS neutro** (0,06): branco, azul e cards compactos, priorizando densidade operacional.
- **Fresh market modular** (0,05): verde folha, amarelo cítrico e superfícies arredondadas, com energia de marca saudável.

### Estilo escolhido: fresh market modular

- **Movimento:** fresh market contemporâneo, com influência de embalagem de alimentos naturais e painéis de operação modernos.
- **Princípios:** apetite sem excesso; hierarquia por cor; leitura rápida no celular; dados acionáveis no admin.
- **Filosofia de cor:** verde profundo comunica confiança e frescor; lima é a assinatura HouseFit; creme dá conforto; coral cria urgência para CTAs e pedidos.
- **Paradigma de layout:** navegação por trilhos horizontais e seções empilhadas no cardápio; painel com barra lateral fixa e módulos assimétricos de leitura.
- **Elementos assinatura:** marca `HOUSE/FIT` em cápsula, chips de categoria com indicador ativo, destaque de pedido no canto inferior direito.
- **Interação:** controles de quantidade sempre próximos ao preço; carrinho abre sem trocar de contexto; status do pedido muda por ação direta.
- **Animação:** transições curtas de 160–220ms; entrada suave de cards; feedback de adição ao carrinho com escala sutil; sem movimento decorativo contínuo.
- **Tipografia:** Manrope para interface e números; Fraunces para títulos de seção e chamadas de apetite.
- **Essência:** refeições práticas, honestas e gostosas para quem quer comer bem sem complicar. Personalidade: direta, fresca, cuidadosa.
- **Tom:** frases curtas e motivadoras. Exemplos: “Seu almoço resolvido.” e “Escolha, aqueça, siga.”
- **Wordmark:** `HOUSE/FIT` com barra diagonal integrada ao separador, remetendo a preparo e performance.
- **Cor proprietária:** verde lima `#B8D83F`, usado como assinatura em badges, gráficos e estados positivos.

## Estrutura de projeto

- `client/src/pages/Home.tsx`: cardápio público, busca, categorias, carrinho e checkout demo.
- `client/src/pages/Admin.tsx`: navegação lateral do admin, dashboard, pedidos, produtos, estoque, clientes e relatórios.
- `client/src/lib/demoData.ts`: catálogo, pedidos e séries de dados demonstrativas.
- `client/src/index.css`: tokens de marca, layout responsivo e componentes visuais.
- `drizzle/schema.ts`: tabelas persistíveis da operação.
- `server/db.ts`: acesso tipado e consultas essenciais.
- `server/routers.ts`: procedures públicas do catálogo e protegidas do admin.
- `public/manus-routes.json`: manifesto das rotas públicas.

## Fluxo de build

1. Implementar o shell visual e os dados demonstrativos.
2. Adicionar schema e procedures tRPC para persistência.
3. Executar diagnósticos TypeScript, build e validação HTTP.
4. Iniciar o Preview na porta configurada e revisar a experiência desktop/mobile.
5. Criar checkpoint no repositório canônico após os checks.

## Fora do primeiro corte

Gateway de pagamento, integração WhatsApp, cálculo geográfico de entrega, importação do catálogo real por scraping e autenticação completa com permissões de múltiplos operadores ficam para a próxima etapa, sem bloquear a navegação ou o protótipo operacional.
