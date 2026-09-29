import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "@fontsource/inter";
import "@fontsource/roboto-condensed/700.css";   // bold
import "@fontsource/roboto-condensed/800.css";   // extrabold — matches font-extrabold
import "./index.css";
import App from './app/App'


createRoot(document.getElementById('root')).render(
  // <StrictMode>
  //   <App />
  // </StrictMode>,
  <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
    <App />
  </BrowserRouter>
)
