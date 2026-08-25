import * as React from "react";

import { cn } from "@/lib/utils";

import { iconVariants, type IconVariantProps } from "./Icon.styles";

export interface IconProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "children">,
    IconVariantProps {}

export type IconComponent = React.FC<IconProps>;

/**
 * Every glyph shares one 24-unit viewBox and inherits `currentColor`, so an icon
 * is sized and coloured by the class the caller already has, not by props.
 */
function createIcon(name: string, paths: React.ReactNode): IconComponent {
  const Icon: IconComponent = ({ className, size, ...props }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-component="Icon"
      data-icon={name}
      {...props}
      className={cn(iconVariants({ size, className }))}
    >
      {paths}
    </svg>
  );

  Icon.displayName = `Icon(${name})`;

  return Icon;
}

export const UploadIcon = createIcon(
  "upload",
  <>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </>,
);

export const CloseIcon = createIcon(
  "close",
  <>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </>,
);

export const ChevronRightIcon = createIcon(
  "chevron-right",
  <path d="m9 5 7 7-7 7" />,
);

export const ChevronDownIcon = createIcon("chevron-down", <path d="m5 9 7 7 7-7" />);

export const PlusIcon = createIcon(
  "plus",
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const DocumentIcon = createIcon(
  "document",
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </>,
);

export const CheckIcon = createIcon("check", <path d="M20 6 9 17l-5-5" />);

export const LogoutIcon = createIcon(
  "logout",
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);
