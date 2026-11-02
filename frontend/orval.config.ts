import { defineConfig } from 'orval'

export default defineConfig({
  workforce: {
    input: './openapi.yaml',
    output: {
      mode: 'single',
      target: './src/api/generated.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/http.ts',
          name: 'customInstance',
        },
      },
    },
  },
})