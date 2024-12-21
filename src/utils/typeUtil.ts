/* eslint-disable @typescript-eslint/no-explicit-any */
import { type z } from "zod";
// https://zenn.dev/ynakamura/articles/65d58863563fbc
//export const schemaForType = <T>() => <S extends z.ZodType<T, never, unknown>>(arg: S) => {
export const schemaForType = <T>() => <S extends z.ZodType<T, any, any>>(arg: S) => {
    return arg;
};
