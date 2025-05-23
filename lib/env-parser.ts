export interface EnvConfig {
  EMAIL_USERNAME: string
  EMAIL_PASSWORD: string
  SENDER_EMAIL: string
  SENDER_NAME: string
}

export function parseEnvFile(content: string): EnvConfig {
  const config: Partial<EnvConfig> = {}
  const lines = content.split("\n")

  for (const line of lines) {
    if (line.trim() === "" || line.startsWith("#")) continue

    const [key, ...valueParts] = line.split("=")
    const value = valueParts.join("=").trim()

    if (key === "EMAIL_USERNAME") config.EMAIL_USERNAME = value
    if (key === "EMAIL_PASSWORD") config.EMAIL_PASSWORD = value
    if (key === "SENDER_EMAIL") config.SENDER_EMAIL = value
    if (key === "SENDER_NAME") config.SENDER_NAME = value
  }

  // Validate that we have all required fields
  if (!config.EMAIL_USERNAME || !config.SENDER_EMAIL || !config.SENDER_NAME) {
    throw new Error("Missing required environment variables")
  }

  return config as EnvConfig
}
