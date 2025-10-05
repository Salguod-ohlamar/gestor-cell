import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './components/ThemeContext.jsx';
import { EstoqueProvider } from './components/EstoqueContext.jsx';
import 'leaflet/dist/leaflet.css';
import './index.css'

const AppWrapper = () => (
  <BrowserRouter>
    <ThemeProvider>
      <EstoqueProvider>
        <App />
      </EstoqueProvider>
    </ThemeProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppWrapper />
)