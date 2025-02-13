export interface Model {
  id: string
  name: string
  provider: string
  providerId: string
}

export const models: Model[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Vnyl-v1-exp',
    provider: 'Vnyl',
    providerId: 'google'
  }
]
