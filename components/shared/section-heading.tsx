import type { ReactNode } from "react";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  titleAs = "h2",
  className,
}: Props) {
  const HeadingTag = titleAs;
  const classes = className
    ? `section-heading ${className}`
    : "section-heading";

  return (
    <div className={classes}>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <HeadingTag>{title}</HeadingTag>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
