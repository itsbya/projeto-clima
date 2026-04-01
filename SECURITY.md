# SECURITY.md - Relatório de Auditoria

Este documento resume a auditoria de **Segurança e Privacidade** realizada no SkyCast.

### Auditoria de Privacidade
- **Dados Localização**: O aplicativo solicita apenas o nome da cidade. As coordenadas geográficas (latitude/longitude) são processadas em tempo real e **não são armazenadas** em nenhum banco de dados persistente além do cache local do navegador do usuário (`localStorage`).
- **Anonimidade**: Não há coleta de dados pessoais, e-mail ou identificadores de sessão. O uso do LocalStorage é estritamente funcional para evitar chamadas de API redundantes.

### Auditoria de Segurança
- **Injeção de Script (XSS)**: O código utiliza `textContent` em vez de `innerHTML` para exibir dados externos, mitigando ataques de injeção de scripts maliciosos.
- **Requisições Seguras**: Toda a comunicação com a API Open-Meteo é realizada via protocolo seguro HTTPS.
- **Proteção de Inputs**: O input de busca de cidade utiliza `encodeURIComponent()` para garantir que caracteres especiais não quebrem a requisição ou permitam injeção de parâmetros maliciosos.

### Recomendações para Produção
- Implementar um limite de taxa (Rate Limiting) caso for realizar deploy em um servidor proxy intermediário, evitando abuso da cota gratuita da API.
- Recomenda-se manter o uso de CDNs confiáveis (Cloudflare) para bibliotecas externas.
