import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProductsProvider } from './context/ProductsContext.jsx';
import { OrdersProvider } from './context/OrdersContext.jsx';
import GlobalStyle from './styles/GlobalStyle.js';
import theme from './styles/theme.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <ProductsProvider>
          <OrdersProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </OrdersProvider>
        </ProductsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
