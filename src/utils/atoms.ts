import { atom } from 'jotai'

export const clientSideApiKeyAtom = atom<string | undefined>(undefined)
export const clientSideLLMCallEnabledAtom = atom<boolean>(false)
