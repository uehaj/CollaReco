"use client";
// https://github.com/t3-oss/create-t3-app/issues/1765#issuecomment-2531274433

import dynamic from "next/dynamic";
import { Suspense, type SuspenseProps } from "react";

export const SuspenseWithoutSsr = dynamic(
  () =>
    Promise.resolve((({ children, ...props }) => (
      <Suspense {...props}>{children}</Suspense>
    )) as React.FC<SuspenseProps>),
  { ssr: false },
);
