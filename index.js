const apiKey = require("./config/apiKey").apiKey;
const apiSecret = require("./config/apiKey").apiSecret;
const BFX = require("bitfinex-api-node");
const Table = require("cli-table2");
const bfx = new BFX({
  apiKey: apiKey,
  apiSecret: apiSecret,
  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
});
const bfxRest2 = bfx.rest(2, { transform: true });
const bfxRest1 = bfx.rest(1, { transform: true });

const offer_minimum = 50.0;
const offer_currency = 'BTC';
const lending_start_date = '2019-09-10'

// Get funding Wallets balance,okay
function get_funding_balance(currency) {
  const currencyUpper = currency.toUpperCase();
  const foundWallet = bfxRest2.wallets().then(wallets => {
    const [wallet] = wallets.filter(
      wallet => wallet.type === "funding" && wallet.currency == currencyUpper
    );
    return wallet;
  });
  return foundWallet.then(foundWallet => foundWallet.balance);
}

// timestampToTime
function timestamp_to_time(timestamp) {
  const date = new Date(timestamp);
  Y = date.getFullYear() + "-";
  M =
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) + "-";
  D = date.getDate() + " ";
  h = date.getHours() + ":";
  m = date.getMinutes() + ":";
  s = date.getSeconds();
  return Y + M + D + h + m + s;
}

// Check All funding Loans.

function check_target_currency_all_funding_loans(currency) {
  let currencyUpper = currency.toUpperCase();
  const fCurrency = `f${currencyUpper}`;

  return bfxRest2.fundingCredits(fCurrency).then(fundingCredits => {
    if (fundingCredits.length == 0) {
      return 0;
    }
    return fundingCredits.reduce(
      (transformingFundingCredit, fundingCredit) => {
        transformingFundingCredit.mtsCreate.push(
          timestamp_to_time(fundingCredit.mtsCreate)
        );
        transformingFundingCredit.mtsUpdate.push(
          timestamp_to_time(fundingCredit.mtsUpdate)
        );
        transformingFundingCredit.amount.push(fundingCredit.amount);
        transformingFundingCredit.symbol.push(fundingCredit.symbol);
        transformingFundingCredit.rate.push(fundingCredit.rate);
        transformingFundingCredit.period.push(fundingCredit.period);
        return transformingFundingCredit;
      },
      {
        mtsCreate: [],
        mtsUpdate: [],
        amount: [],
        symbol: [],
        rate: [],
        period: []
      }
    );
  });
}
// Check All funding Loans amount.
function check_target_currency_all_funding_loans_amount(offer_currency) {
  return new Promise(function(resolve, reject) {
    check_target_currency_all_funding_loans(offer_currency).then(r => {
      let amountTotal = 0;
      for (let i = 0; i < r.amount.length; i++) {
        amountTotal += r.amount[i];
      }
      resolve(amountTotal);
    });
  });
}

// Check funding Offers
function check_funding_offers(currency) {
  let currencyUpper = currency.toUpperCase();
  const fCurrency = `f${currencyUpper}`;

  return bfxRest2.fundingOffers(fCurrency).then(res => {
    if (res.length == 0) {
      return 0;
    }
    let data = {
      mtsCreate: [],
      mtsUpdate: [],
      amount: [],
      symbol: [],
      rate: [],
      period: []
    };
    for (let i = 0; i < res.length; i++) {
      data.mtsCreate[i] = timestamp_to_time(res[i].mtsCreate);
      data.mtsUpdate[i] = timestamp_to_time(res[i].mtsUpdate);
      data.amount[i] = res[i].amount;
      data.symbol[i] = res[i].symbol;
      data.rate[i] = res[i].rate;
      data.period[i] = res[i].period;
    }
    return data;
  });
}

// Offers amount
function check_funding_offers_amount(offer_currency) {
  return new Promise(function(resolve, reject) {
    check_funding_offers(offer_currency).then(r => {
      let amountTotal = 0;
      if (r != 0) {
        for (let i = 0; i < r.amount.length; i++) {
          amountTotal += r.amount[i];
        }
        resolve(amountTotal);
      }
      resolve(amountTotal);
    });
  });
}

// Gat available_amount
const get_available_amount = async currency => {
  let funding_balance = await get_funding_balance(currency);

  let funding_loans_amount = await check_target_currency_all_funding_loans_amount(
    currency
  );
  let funding_offers_amount = await check_funding_offers_amount(currency);
  let available_amount =
    funding_balance - funding_loans_amount - funding_offers_amount;
  return available_amount;
};

// Get funding book.
function get_funding_book(currency, limit_asks, limit_bids) {
  const options = { limit_asks: limit_asks, limit_bids: limit_bids };
  return new Promise(function(resolve, reject) {
    bfxRest1.fundingbook(currency, options, (err, res) => {
      if (err) console.log(err);
      resolve(res);
    });
  });
}

// funding credits
function offer_a_funding(currency, amount, rate, period, direction, cb) {
  return new Promise(function(resolve, reject) {
    return bfxRest1.new_offer(
      currency,
      amount,
      rate,
      period,
      direction,
      (err, res) => {
        if (err) console.log(err);
        resolve(res);
      }
    );
  });
}

// check_price
function check_price(currency) {
  if (currency === "USD")
    return Promise.resolve({
      last_price: "1"
    });
  const symbol = currency + "USD";
  return new Promise(function(resolve, reject) {
    bfxRest1.ticker(symbol, (err, res) => {
      if (err) console.log(err);
      resolve(res);
    });
  });
}

// Check balance, if possible send amount.
const checkIfPoss = async currency => {
  let balance = await get_available_amount(currency);
  let price = await check_price(currency);
  let total = Number(balance) * Number(price.last_price);
  if (total >= offer_minimum) {
    return balance;
  } else {
    return {
      balance: balance,
      total: total
    };
  }
};

// Check total income
function check_total_income(offer_currency, lending_start_date) {
  const lending_start_date_t = new Date(lending_start_date).getTime();
  return new Promise(function(resolve, reject) {
    return bfxRest1.balance_history(offer_currency, {}, (err, res) => {
      if (err) console.log(err);
      let ob = [];
      for (let i = 0; i < res.length; i++) {
        const timestamp1000 = Number(res[i].timestamp) * 1000;
        if (
          timestamp1000 > lending_start_date_t &&
          res[i].description == "Margin Funding Payment on wallet deposit"
        ) {
          ob.push(res[i]);
        }
      }
      resolve(ob);
    });
  });
}

// Renders an overview.
const render_overview = async offer_currency => {
  console.clear();
  const ba = await checkIfPoss(offer_currency);
  let remaining_balance = 0;

  if (typeof ba === "number") {
    const funding_book = await get_funding_book(offer_currency, 1, 1);
    let funding_r = "";
    let funding_a = "";
    let funding_p = "";
    let funding_book_asks_rate_range = funding_book.asks[0].rate * 1.2;
    if (funding_book.bids[0].rate < funding_book_asks_rate_range) {
      funding_r = funding_book.asks[0].rate;
      funding_a = funding_book.asks[0].amount;
      funding_p = funding_book.asks[0].period;
    } else {
      funding_r = funding_book.bids[0].rate;
      funding_a = funding_book.bids[0].amount;
      funding_p = funding_book.bids[0].period;
    }
    let check_amount = "";
    if (funding_a < ba) {
      check_amount = String(funding_a);
    } else {
      check_amount = String(ba);
    }
    await offer_a_funding(
      offer_currency,
      check_amount,
      funding_r,
      funding_p,
      "lend"
    );
  } else {
    remaining_balance = ba.balance;
  }
  const t = new Table({
    head: ["Opening", "Currency", "Amount", "Rate", "Period", "LastPayout"],
    colWidths: [21]
  });
  let funding_loaning = await check_target_currency_all_funding_loans(
    offer_currency
  );

  if (funding_loaning != 0) {
    for (let i = 0; i < funding_loaning.amount.length; i++) {
      let funding_loaning_rate365 = funding_loaning.rate[i] * 365;
      funding_loaning_rate365 = funding_loaning_rate365.toFixed(4) * 100 + "%";
      t.push([
        funding_loaning.mtsCreate[i],
        funding_loaning.symbol[i],
        funding_loaning.amount[i],
        funding_loaning_rate365,
        funding_loaning.period[i],
        funding_loaning.mtsUpdate[i]
      ]);
    }
  }

  const t1 = new Table({
    head: ["Opening", "Currency", "Amount", "Rate", "Period", "LastPayout"]
  });
  let funding_offers = await check_funding_offers(offer_currency);
  if (funding_offers != 0) {
    for (let i = 0; i < funding_offers.amount.length; i++) {
      t1.push([
        funding_offers.mtsCreate[i],
        funding_offers.symbol[i],
        funding_offers.amount[i],
        funding_offers.rate[i],
        funding_offers.period[i],
        funding_offers.mtsUpdate[i]
      ]);
    }
  }
  let total_income = await check_total_income(
    offer_currency,
    lending_start_date
  );
  if (total_income.length == 0) {
    return false;
  }
  const t2 = new Table({
    head: ["Currency", "Total", "昨日收益", "累计收益", "累计USD收益"]
  });
  let cumulative_income = 0;
  if (total_income.length == 1) {
    cumulative_income = total_income[0].amount;
  }
  if (total_income.length > 1) {
    const len = total_income.length - 1;
    cumulative_income = total_income[0].balance - total_income[len].balance;
    cumulative_income = cumulative_income.toFixed(8);
  }

  let price = await check_price(offer_currency);
  let usd_valuation = cumulative_income * Number(price.last_price);
  usd_valuation = usd_valuation.toFixed(2);

  t2.push([
    total_income[0].currency,
    total_income[0].balance,
    total_income[0].amount,
    cumulative_income,
    usd_valuation
  ]);

  const renderString = `
" ————————————————————————— XiaoJi BITFINEX LENDING BOT ————————————————————————— "

" ———————————————————————————————— 已提供 ————————————————————————————————— "
${t.toString()}


" ———————————————————————————————— 掛單中 ————————————————————————————————— "
${funding_offers === 0 ? "No funding loans" : t1.toString()}


" ———————————————————————————————— 剩餘數量 ————————————————————————————————— "
${remaining_balance}


" ———————————————————————————————— 累積收益 ————————————————————————————————— "
${t2.toString()}
`;
  console.log(renderString);
};

setInterval(function() {
  render_overview(offer_currency);
}, 10000);
