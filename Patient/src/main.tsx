import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode intentionally omitted: it double-invokes effects in dev, which would
// start the voice flow twice (double greeting, overlapping speech). The kiosk runs
// a single long-lived voice session, so we mount once.
createRoot(document.getElementById('root')!).render(<App />)
