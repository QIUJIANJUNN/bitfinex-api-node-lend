const apiKey = require("./config/apiKey").apiKey;
const apiSecret = require("./config/apiKey").apiSecret;

const BFX = require("bitfinex-api-node");
const bfx = new BFX({
  apiKey: apiKey,
  apiSecret: apiSecret,

  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
});
const rest = bfx.rest(2, { transform: true });

rest.balances().then(res => console.log(res));
// console.log(apiKey)
