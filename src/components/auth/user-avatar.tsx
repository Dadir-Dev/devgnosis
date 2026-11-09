"use client";

import { useState } from "react";

import { getInitials } from "@/features/auth/initials";
import { cn } from "@/lib/utils";

type UserAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<UserAvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
};

function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

type UserAvatarProps = {
  name: string;
  email?: string | null;
  image?: string | null;
  size?: UserAvatarSize;
  className?: string;
  /** When false, the image gets `alt={name}`. Defaults to true. */
  decorative?: boolean;
};

/**
 * Provider avatar with an initials fallback. A broken remote image is tracked
 * by URL, so changing `image` retries the new URL instead of staying on the
 * fallback.
 */
export function UserAvatar({
  name,
  email,
  image,
  size = "md",
  className,
  decorative = true,
}: UserAvatarProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageUrl = isHttpUrl(image) ? image : null;
  const showImage = imageUrl !== null && failedImage !== imageUrl;
  const initials = getInitials(name) || getInitials(email ?? "") || "?";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground select-none",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showImage && imageUrl ? (
        // Provider avatar hosts are arbitrary remote URLs, so they are not part
        // of a `next/image` allowlist; `onError` provides the fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={decorative ? "" : name}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedImage(imageUrl)}
        />
      ) : (
        <span aria-hidden={decorative || undefined}>{initials}</span>
      )}
    </span>
  );
}
