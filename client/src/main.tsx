import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './app/store.ts'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ScrollToTop from './components/ScrollToTop.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <ScrollToTop />
      <GoogleOAuthProvider clientId='870653784456-3ilp2gjt8vjd2u8pd9fjq0afr4sc85pr.apps.googleusercontent.com' >
        <Provider store={store} >
          <App />
        </Provider>
      </GoogleOAuthProvider>
    </Router>
  </StrictMode>,
)
