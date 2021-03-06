import fetch from "isomorphic-fetch"

import config from "./config"


function fetchJson(url, options) {
  return fetch(url, options).then(parseJsonResponse)
}


async function parseJsonResponse(response) {
  const data = await response.json()
  if (response.status >= 200 && response.status < 300) {
    return data
  } else {
    throw new Error(JSON.stringify(data.error))
  }
}


export function fetchParameters(apiBaseUrl = config.apiBaseUrl) {
  return fetchJson(`${apiBaseUrl}/api/1/parameters`)
}


export function fetchVariables(apiBaseUrl = config.apiBaseUrl) {
  return fetchJson(`${apiBaseUrl}/api/1/variables`)
}
