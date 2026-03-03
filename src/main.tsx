import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "next-themes"
import { ClerkProvider } from '@clerk/clerk-react'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  publishableKey ? (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <ThemeProvider attribute="class" defaultTheme="light">
        <App />
      </ThemeProvider>
    </ClerkProvider>
  ) : (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Clerk is not configured</h1>
          <p style={{ marginBottom: 12 }}>
            Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> to enable authentication.
          </p>
          <p style={{ marginBottom: 0 }}>
            After adding it, restart the dev server.
          </p>
        </div>
      </div>
    </ThemeProvider>
  )
);
