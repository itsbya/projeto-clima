# 🌦️ SkyCast - Previsão do Tempo

SkyCast é um aplicativo web leve e prático para consultar dados meteorológicos globais em tempo real. Este projeto foi desenvolvido inteiramente com HTML, CSS e **JavaScript Puro (Vanilla JS)** e consome dados da [Open-Meteo API](https://open-meteo.com/), proporcionando informações climáticas precisas e atualizadas.

## 🚀 Funcionalidades

- **Busca Global**: Digite o nome de qualquer cidade no mundo para visualizar a previsão do tempo atual.
- **Dados Detalhados**: Inclui a temperatura atual (com máximas e mínimas do dia), umidade, velocidade do vento e quantidade de chuva.
- **Design Dinâmico**: Tema limpo e moderno, suportando cores dinâmicas para o período diurno e noturno automaticamente.
- **Segurança de Código**: Código implementado com validações para tratamento de exceções (limite de requisições, timeout, cidade não encontrada) e forte tipagem documentada via JSDoc.

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**: Estrutura acessível e semântica de layouts dinâmicos e fluidos.
- **JavaScript (ES6+)**: Consumo de APIs via `Fetch API`, manipulação moderna do DOM e tratamento rigoroso de execuções com chamadas assíncronas.
- **Jest**: Conjunto de testes unitários para a API que atinge 100% de cobertura nos métodos, preparado para rodar em modo `ES Modules`.

## 📦 Como rodar localmente

Se você deseja explorar ou contribuir com o projeto, siga as etapas abaixo:

### Pré-requisitos
- Ter o **Node.js** instalado (necessário caso queira executar os testes).

### Instalação

1. Clone o repositório em sua máquina:
   ```bash
   git clone https://github.com/itsbya/projeto-clima.git
   ```
2. Entre no diretório do projeto:
   ```bash
   cd projeto-clima
   ```
3. Use alguma ferramenta de Live Server do próprio editor de código para hospedar o `index.html` ou abra o arquivo diretamente em seu navegador web.
   - *Nota: O app é focado completamente no frontend (Vanilla JS).*

### Executando os Testes

Para garantir que a integração com as APIs está sendo validada perfeitamente:

1. Instale as dependências de desenvolvimento do projeto pelo NPM:
   ```bash
   npm install
   ```
2. Execute o script de testes configurado (requer Node com suporte experimental ECMAScript):
   ```bash
   npm test
   ```

## 📚 Estrutura da Documentação

A aplicação foi rigorosamente padronizada utilizando comentários `@JSDoc`. Você encontrará referências específicas na raiz de todo o programa para métodos que consomem dados climáticos, onde documentamos:

- `@param`: Os requisitos de dados imputados por requisições originadas do front-end.
- `@returns`: O que cada método provê ou extrai localmente.
- `@throws`: Cenários críticos previstos, como `INVALID_INPUT`, `NOT_FOUND`, `GEO_API_ERROR` ou falha de rede.

## 📝 Licença

Projeto desenvolvido para fins educacionais e pessoais. Sem licença restritiva aplicável atualmente. Fique à vontade para explorá-lo!
