import assert from 'node:assert/strict'
import test from 'node:test'

import { api, request } from './axios.js'

test('request sends GET payload as query params', async () => {
  api.defaults.adapter = async (config) => ({
    data: { method: config.method, params: config.params, data: config.data },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })

  const response = await request('GET', '/group_data/3341', { survey_id: 'survey-1' })

  assert.deepEqual(response, {
    method: 'get',
    params: { survey_id: 'survey-1' },
    data: null,
  })
})

test('request sends non-GET payload as request body', async () => {
  api.defaults.adapter = async (config) => ({
    data: { method: config.method, params: config.params, data: JSON.parse(config.data) },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })

  const response = await request('POST', '/login', { username: 'admin' })

  assert.deepEqual(response, {
    method: 'post',
    params: null,
    data: { username: 'admin' },
  })
})

test('request throws backend detail on failed response', async () => {
  api.defaults.adapter = async (config) => {
    const error = new Error('Request failed')
    error.response = { data: { detail: 'No access' } }
    error.config = config
    throw error
  }

  await assert.rejects(
    () => request('GET', '/survey/closed'),
    (error) => error === 'No access',
  )
})
