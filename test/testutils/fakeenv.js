"use strict"

export function setupEnvironmentVariables() {
  process.env.COOKIE_SESSION = '__r_c_sess_'
  process.env.COOKIE_SECRET_KEY = 'cookie-secret-key'
  process.env.EMAIL_NAME_SALTY = 'emailnamesalty'
  process.env.EMAIL_DOMAIN_SALTY = 'emaildomainsalty'
  process.env.EMAIL_VALLIDATION_SIGN_KEY = 'email-sign-key'
  process.env.EMAIL_EXPIRE_VALIDATION_LINK = '24h'
}

export function clearEnvironmentVariables() {
  process.env.COOKIE_SESSION = undefined
  process.env.COOKIE_SECRET_KEY = undefined
  process.env.EMAIL_NAME_SALTY = undefined
  process.env.EMAIL_DOMAIN_SALTY = undefined
  process.env.EMAIL_VALLIDATION_SIGN_KEY = undefined
  process.env.EMAIL_EXPIRE_VALIDATION_LINK = undefined
}
