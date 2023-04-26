"use strict"

export function setupEnvironmentVariables() {
  process.env.EMAIL_NAME_SALTY = 'emailnamesalty'
  process.env.EMAIL_DOMAIN_SALTY = 'emaildomainsalty'
  process.env.EMAIL_VALLIDATION_SIGN_KEY = 'email-sign-key'
  process.env.EMAIL_EXPIRE_VALIDATION_LINK = '24h'
}

export function clearEnvironmentVariables() {
  process.env.EMAIL_NAME_SALTY = undefined
  process.env.EMAIL_DOMAIN_SALTY = undefined
  process.env.EMAIL_VALLIDATION_SIGN_KEY = undefined
  process.env.EMAIL_EXPIRE_VALIDATION_LINK = undefined
}
