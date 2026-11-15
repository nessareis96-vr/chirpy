# Chirpy
API de uma aplicação de mensagens curtas, desenvolvida em TypeScript com Express e PostgreSQL durante o curso de Web Servers do Boot.dev.

O projeto permite cadastrar usuários, autenticar sessões, publicar e consultar mensagens de até 140 caracteres e excluir publicações do próprio autor. Também recebe webhooks de um provedor de pagamentos fictício para ativar a assinatura Chirpy Red.

A implementação reúne fundamentos de backend: HTTP, middlewares, banco relacional, migrations, autenticação, autorização e testes unitários. Trata-se de um projeto educacional guiado.

## Funcionalidades

- Cadastro e atualização de e-mail e senha do usuário autenticado.
- Hash de senhas com Argon2, sem expor senhas ou hashes nas respostas.
- Access tokens JWT com validade de uma hora.
- Refresh tokens persistidos no banco, válidos por 60 dias, com renovação de access tokens e revogação.
- Criação de chirps com validação de tamanho e substituição das palavras definidas pelo exercício.
- Listagem com filtro opcional por autor e ordenação por data de criação.
- Consulta de um chirp por ID e exclusão restrita ao autor.
- Webhook protegido por API key para ativação do Chirpy Red.
- Arquivos estáticos, readiness, logs de respostas e contagem de requisições ao fileserver.

## Tecnologias

Node.js e TypeScript, Express, PostgreSQL, Drizzle ORM, Argon2, jsonwebtoken, Vitest 3


## Aprendizados

- Organização de um servidor Express e ordem dos middlewares.
- Separação entre handlers HTTP e acesso a dados.
- Validação em execução, tipos inferidos e respostas sem campos sensíveis.
- Modelagem relacional e evolução do banco com migrations.
- Diferença entre autenticação e autorização por autoria.
- Ciclo de vida de access tokens e refresh tokens.
- Integração por webhook e autenticação com API key.
- Testes unitários e uso de clientes HTTP para conferir contratos da API.