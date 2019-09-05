const crypto = require('crypto')
const request = require('request')

const apiKey = require("./config/apiKey").apiKey;
const apiSecret = require("./config/apiKey").apiSecret;

const apiPath = 'v2/auth/r/alerts'
const nonce = Date.now().toString()
const queryParams = 'type=price'
const body = {}
let signature = `/api/${apiPath}${nonce}${JSON.stringify(body)}`

const sig = crypto.createHmac('sha384', apiSecret).update(signature)
const shex = sig.digest('hex')

const options = {
  url: `https://api.bitfinex.com/${apiPath}?${queryParams}`,
  headers: {
    'bfx-nonce': nonce,
    'bfx-apikey': apiKey,
    'bfx-signature': shex
  },
  body: body,
  json: true
}

const options1 = {
    url: `https://api.bitfinex.com/v2/auth/r/wallets/`,
    headers: {
      'bfx-nonce': nonce,
      'bfx-apikey': apiKey,
      'bfx-signature': shex
    },
    body: body,
    json: true
  }

// request.post(
//     `${url}/auth/r/info/user`,
//     headers: {options.headers},
//     body: {options.body},
//     json: true,
//     (error, response, body) => console.log(body)
//   )

request.post(options, (error, response, body) => {
  console.log(body);
})

// console.log(`${url}`)

///
// var request = require("request");

// request.post(
//     `${url}/auth/r/wallets`,
//     headers: { /* auth headers */ },
//     body: {},
//     json: true,
//     (error, response, body) => console.log(body)
//   )