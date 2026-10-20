"use client"

import React, { useState } from "react"
import { getLogoUrl, getRestaurantName } from "@lib/util/env"

type StoreLogoProps = {
  className?: string
  imageClassName?: string
  textClassName?: string
  showText?: boolean
  showLogo?: boolean
}

export default function StoreLogo({
  className = "flex items-center gap-x-2.5",
  imageClassName = "h-8 w-auto max-h-8 object-contain",
  textClassName = "txt-compact-xlarge-plus font-bold uppercase tracking-tight",
  showText = true,
  showLogo = true,
}: StoreLogoProps) {
  const restaurantName = getRestaurantName()
  const logoUrl = getLogoUrl()
  const [imgError, setImgError] = useState(false)

  const hasValidLogo = showLogo && Boolean(logoUrl) && !imgError

  return (
    <div className={className}>
      {hasValidLogo && (
        <img
          src={logoUrl}
          alt={restaurantName}
          className={imageClassName}
          onError={() => setImgError(true)}
        />
      )}
      {(showText || !hasValidLogo) && (
        <span className={textClassName}>{restaurantName}</span>
      )}
    </div>
  )
}
