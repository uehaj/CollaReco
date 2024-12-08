import { atom } from 'jotai'

export const showModalAtom = atom<boolean>(false)
export const clientSideApiKeyAtom = atom<string | undefined>(undefined)
