export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}

export const getRestaurantName = () => {
  return process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Nucleo Delivery"
}

export const getLogoUrl = () => {
  return process.env.NEXT_PUBLIC_LOGO_URL || "/logo-default.png"
}

export const getPrimaryColor = () => {
  return process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#E53935"
}
