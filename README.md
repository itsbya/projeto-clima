# SkyCast - Weather Intelligence Engine 🌤️

### O Futuro da Observação Meteorológica em Tiempo Real

![Licença](https://img.shields.io/badge/License-MIT-blue.svg)
![Build](https://img.shields.io/badge/Build-7/7_Passed-success.svg)

SkyCast é uma aplicação web de alta precisão desenvolvida para fornecer previsões meteorológicas detalhadas com uma interface minimalista e profissional. Utilizando a infraestrutura da **Open-Meteo API**, o projeto foi refinado sob diretrizes rigorosas de engenharia de software, incluindo cache inteligente, auditoria de segurança e geocoding enriquecido.

---

## 🎯 Funcionalidades Principais

- **Motor de Previsão 5 Dias**: Exibição detalhada de temperaturas máximas e mínimas para a semana.
- **Geocoding Avançado (Enriquecido)**: Busca contextual que identifica Bairros, Estados e Países.
- **Cache Service (Performance)**: Sistema de persistência em LocalStorage com TTL de 30 minutos para economia de banda.
- **Modo Noturno Inteligente**: Interface reativa baseada no estado solar (`is_day`) da localização pesquisada.
- **Relatório de GRC**: Alertas de privacidade e licenciamento inclusos na interface.

---

## 🏗️ Arquitetura e Engenharia

O projeto segue padrões modernos de desenvolvimento JavaScript:
1. **Engine de API (`api.js`)**: Totalmente documentado com **JSDoc**, utilizando tratamento de exceções amigável.
2. **Design Glassmorphism**: CSS puro com variáveis dinâmicas e filtros de desfoque.
3. **Qualidade Garantida**: Suíte de testes unitários automatizados com **Jest** (ver pasta `/tests`).

---

## 🚀 Como Iniciar

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Execute os testes (Jest)**:
   ```bash
   npm test
   ```

3. **Inicie o servidor local**:
   Você pode usar qualquer servidor estático ou a extensão *Live Server*.

---

## ⚖️ Licença e Governança

Este projeto está licenciado sob a **MIT License**. 
- Consulte o arquivo `LICENSE` para detalhes legais.
- Consulte `NOTICE.md` para as atribuições de terceiros (Open-Meteo, Fonts, Icons).
- Consulte `SECURITY.md` para o relatório de auditoria e privacidade.

---

*Desenvolvido com excelência técnica por Antigravity Engineering.*
