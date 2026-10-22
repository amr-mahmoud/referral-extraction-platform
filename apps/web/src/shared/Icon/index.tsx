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

export const DownloadIcon = createIcon(
  "download",
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

export const ChevronLeftIcon = createIcon(
  "chevron-left",
  <path d="m15 5-7 7 7 7" />,
);

export const ChevronDownIcon = createIcon("chevron-down", <path d="m5 9 7 7 7-7" />);

export const PlusIcon = createIcon(
  "plus",
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const PencilIcon = createIcon(
  "pencil",
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </>,
);

export const DocumentIcon = createIcon(
  "document",
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </>,
);

export const ZoomInIcon = createIcon(
  "zoom-in",
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </>,
);

export const ZoomOutIcon = createIcon(
  "zoom-out",
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
    <path d="M8 11h6" />
  </>,
);

export const CheckIcon = createIcon("check", <path d="M20 6 9 17l-5-5" />);

export const LoaderIcon = createIcon(
  "loader",
  <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
);

export const LogoutIcon = createIcon(
  "logout",
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

export const GitHubIcon = createIcon(
  "github",
  <path
    fill="currentColor"
    stroke="none"
    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
  />
);

export const ExternalLinkIcon = createIcon(
  "external-link",
  <>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </>,
);

