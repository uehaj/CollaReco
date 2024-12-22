import { atom } from 'jotai'

export const clientSideApiKeyAtom = atom<string | undefined>(undefined)
export const clientSideLLMCallEnabledAtom = atom<boolean>(false)
export const selectedSessionAtom = atom<number>(0);
