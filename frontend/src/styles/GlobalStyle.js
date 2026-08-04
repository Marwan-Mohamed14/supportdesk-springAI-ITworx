import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    margin: 0;
    font-family: ${({ theme }) => theme.font};
    color: ${({ theme }) => theme.colors.textDark};
    -webkit-font-smoothing: antialiased;
  }

  input, button {
    font-family: inherit;
  }

  a {
    color: inherit;
  }
`;

export default GlobalStyle;
