import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function RevealSection({ children, className = "" }: Props) {
  return <div className={className}>{children}</div>;
}

interface TaglineProps {
  text: string;
  className?: string;
}

export function TaglineReveal({ text, className = "" }: TaglineProps) {
  return <div className={className}>{text}</div>;
}
