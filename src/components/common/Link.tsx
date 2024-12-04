"use client";

import { Button, ButtonProps } from "antd";
import { useRouter } from "next/navigation";

interface LinkProps extends ButtonProps {
  to: string;
}

export default function Link({ to, children, ...props }: LinkProps) {
  const router = useRouter();
  return (
    <Button {...props} type="text" onClick={() => router.push(to)}>
      {children}
    </Button>
  );
}
