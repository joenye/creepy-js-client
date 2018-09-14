import _ from 'lodash'

export const baseUrl = process.env.REACT_APP_API_BASE_URL

const createQueryString = (map) => {
  return '?' + _.toPairs(map).map(x => x.join('=')).join('&')
}

const doJson = (url, params = {}, raw = false) => {
  // const authToken = window.localStorage.getItem('authToken')
  const query = params.qs ? createQueryString(params.qs) : ''
  const maybeSlash = url[0] === '/' ? '' : '/'
  const urlIsExternal = /^((https?)|(\/\/))/.test(url)

  const endpoint = urlIsExternal
    ? `${url}${query}`
    : `${baseUrl}${maybeSlash}${url}${query}`

  const paramsWithDefaults = {
    ...params,
    headers: {
      // 'Authorization': 'Bearer ' + authToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...params.headers
    },
    body: (params.body && (typeof params.body !== 'string'))
      ? JSON.stringify(params.body)
      : undefined
  }

  fetch(endpoint, paramsWithDefaults)
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw Object.assign(new Error(), err)
        })
      }
    })
    .then(res => {
      return params.raw
        ? res
        : res.text().then(text => text.length ? JSON.parse(text) : null)
    })
}

export const getJson = (url, params) => doJson(url, { method: 'GET', ...params })
export const postJson = (url, params) => doJson(url, { method: 'POST', ...params })
export const putJson = (url, params) => postJson(url, { method: 'PUT', ...params })
export const deleteJson = (url, params) => postJson(url, { method: 'DELETE', ...params })
