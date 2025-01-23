/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GA: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }