import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ComponentGallery } from './dev/ComponentGallery.tsx'

const showGallery = import.meta.env.DEV && new URLSearchParams(window.location.search).has('gallery')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showGallery ? <ComponentGallery /> : <App />}
  </StrictMode>,
)
