# Frontend para uma dashboard de filmes

Uma single-page application (SPA) para gerenciar sua lista filmes a ver e marcar os filmes já vistos.

## Descrição do Projeto

O Movie Dashboard é um aplicativo client-side que permite aos usuários navegar por filmes, manter uma lista de exibição de filmes que desejam assistir, rastrear filmes que assistiram e visualizar suas estatísticas de exibição. Ele é construído com JavaScript básico (sem frameworks), HTML5 e CSS usando Bootstrap para styling.

### Principais Características

- Registro de usuário e login sem autenticação
- Adicionar filmes à lista de observação
- Marque os filmes como assistidos com classificações e notas
- Painel pessoal com estatísticas e gráficos
- Design responsivo para desktop

## Instruções de Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Bernmor/MVP1-front-end.git
   cd movie-dashboard-frontend
   ```

2. **Abra no navegador**

   Basta abir o arquivo `index.html` em seu navegador de preferência:
   ```bash
   # No macOS
   open index.html
   
   # No Linux
   xdg-open index.html
   
   # No Windows
   start index.html
   ```

3. **Backend da API**

   Este aplicativo front-end requer que o back-end da API Movie Dashboard esteja em execução. Certifique-se de rodar o back-end disponível em https://github.com/Bernmor/MVP1-back-end.

## Estrutura do Projeto

```
front_end/
├── index.html          
├── app.js              
├── styles.css          
└── README.md           
```

## Feito com

- HTML5
- CSS3
- JavaScript (ES6+)
- [Bootstrap 5](https://getbootstrap.com/) - CSS framework
- [Font Awesome](https://fontawesome.com/) - Ícones
- [Chart.js](https://www.chartjs.org/) - Para a visualização das estatísticas