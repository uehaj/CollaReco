import { atom } from 'jotai'

export const clientSideApiKeyAtom = atom<string | undefined>(undefined)
export const clientSideLLMCallEnabledAtom = atom<boolean>(false)
export const selectedSessionAtom = atom<string | undefined>(undefined);
export const serverSideExplicitPassThroughAtom = atom<boolean>(false);
export const errorAtom = atom<string | undefined>(undefined);
export const recordingAtom = atom<boolean>(false);
export const recognitionAtom = atom<SpeechRecognition | null>(null);
