const apiKey = require("./config/apiKey").apiKey;
const apiSecret = require("./config/apiKey").apiSecret;
const BFX = require("bitfinex-api-node");
const Table = require('cli-table2');
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

// Get funding Wallets balance,okay
function get_funding_balance(currency) {
    let currencyUpper = currency.toUpperCase()
    return bfxRest2.wallets().then(res => {
        let filterFunding = res.map(function(item){
            if ( item.type == "funding" && item.currency == currencyUpper) {
                return item
            }
        })
        return filterFunding[0].balance
    })
}

// timestampToTime
function timestamp_to_time(timestamp){
    const date = new Date(timestamp)
    Y = date.getFullYear() + '-';
    M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
    D = date.getDate() + ' ';
    h = date.getHours() + ':';
    m = date.getMinutes() + ':';
    s = date.getSeconds(); 
    return Y+M+D+h+m+s
}

// Check All funding Loans.
function check_all_funding_loans(currency) {
    let currencyUpper = currency.toUpperCase()
    const fCurrency = `f${currencyUpper}`

    return bfxRest2.fundingCredits(fCurrency).then(res => {
        if (res.length == 0) {
            return 0
        } 
        let data = {
            'mtsCreate': [],
            'mtsUpdate': [],
            'amount': [],
            'symbol': [],
            'rate': [],
            'period': [],
        }
        for(let i = 0; i < res.length ; i++){
            data.mtsCreate[i] = timestamp_to_time(res[i].mtsCreate) 
            data.mtsUpdate[i] = timestamp_to_time(res[i].mtsUpdate)
            data.amount[i] = res[i].amount 
            data.symbol[i] = res[i].symbol 
            data.rate[i] = res[i].rate 
            data.period[i] = res[i].period 
        }
        return data
    })
}

// Check All funding Loans amount.
function check_all_funding_loans_amount(offer_currency){
    return new Promise(function(resolve, reject){
        check_all_funding_loans(offer_currency).then(r =>{
            let amountTotal = 0
            for (let i = 0; i < r.amount.length; i++){
                amountTotal += r.amount[i]
            }
            resolve(amountTotal)
            })
    })
}

// Check funding Offers 
function check_funding_offers(currency) {
    let currencyUpper = currency.toUpperCase()
    const fCurrency = `f${currencyUpper}`

    return bfxRest2.fundingOffers(fCurrency).then(res => {
        if (res.length == 0) {
            return 0
        } 
        let data = {
            'mtsCreate': [],
            'mtsUpdate': [],
            'amount': [],
            'symbol': [],
            'rate': [],
            'period': [],
        }
        for(let i = 0; i < res.length ; i++){
            data.mtsCreate[i] = timestamp_to_time(res[i].mtsCreate) 
            data.mtsUpdate[i] = timestamp_to_time(res[i].mtsUpdate) 
            data.amount[i] = res[i].amount 
            data.symbol[i] = res[i].symbol 
            data.rate[i] = res[i].rate 
            data.period[i] = res[i].period 
        }
        return data
    })
}

// Offers amount
function check_funding_offers_amount(offer_currency){
    return new Promise(function(resolve, reject){
        check_funding_offers(offer_currency).then(r =>{
            let amountTotal = 0
            if (r != 0) {
                for (let i = 0; i < r.amount.length; i++){
                    amountTotal += r.amount[i]
                }
                resolve(amountTotal)
            }
            resolve(amountTotal)
            })
    })
}

// Gat available_amount
const get_available_amount = async(currency)  => {
    let funding_balance = await get_funding_balance(currency)
    
    let funding_loans_amount =  await check_all_funding_loans_amount(currency)
    let funding_offers_amount = await check_funding_offers_amount(currency)
    let available_amount = funding_balance - funding_loans_amount - funding_offers_amount
    return available_amount
}

// Get funding book.
function get_funding_book(currency, limit_asks, limit_bids) {
    const options = {'limit_asks':limit_asks , 'limit_bids': limit_bids}
    return new Promise(function(resolve, reject) {
        bfxRest1.fundingbook(currency, options, (err, res) => {
            if (err) console.log(err)
            resolve(res)
        })
        
        
    })
    
}

// funding credits
function offer_a_funding(currency, amount, rate, period, direction, cb){
    return new Promise(function(resolve, reject) {
        return bfxRest1.new_offer(currency, amount, rate, period, direction, (err, res) => {
            if (err) console.log(err)
            resolve(res)
        })
    })
} 

// check_price
function check_price(currency){
    const symbol = currency + 'USD';
    return new Promise(function(resolve, reject) {
        bfxRest1.ticker(symbol, (err, res) => {
            if (err) console.log(err)
            resolve(res)
        })
    })
} 

// Check balance, if possible send amount.
const checkIfPoss = async(currency)  => {
    let balance = await get_available_amount(currency)
    let price =  await check_price(currency)
    let total = Number(balance) * Number(price.last_price)
    if(total >= offer_minimum) {
        return balance
    } else {
        return {
            'balance': balance,
            'total': total,
        }
    }  
}

// Renders an overview.
const render_overview = async(offer_currency)  => {
    // console.clear();
    console.log();
	console.log(' ————————————————————————— XiaoJi BITFINEX LENDING BOT —————————————————————————');
	console.log();

    const ba = await checkIfPoss(offer_currency)
    let remaining_balance = 0
    if (typeof ba === 'number'){
        const funding_book = await get_funding_book(offer_currency,1,1)
        let funding_r = ''
        let funding_a = ''
        let funding_p = ''
        let funding_book_asks_rate_range = funding_book.asks[0].rate * 1.2
        if (funding_book.bids[0].rate < funding_book_asks_rate_range) {
            funding_r = funding_book.asks[0].rate
            funding_a = funding_book.asks[0].amount
            funding_p = funding_book.asks[0].period
        } else {
            funding_r = funding_book.bids[0].rate
            funding_a = funding_book.bids[0].amount
            funding_p = funding_book.bids[0].period
        }
        let check_amount = ''
        if(funding_a < ba) {
            check_amount = String(funding_a)
        } else {
            check_amount = String(ba)
        }
        await offer_a_funding(offer_currency, check_amount, funding_r, funding_p, 'lend')
    } else {
        remaining_balance = ba.balance
    }
    const t = new Table({
        head: ['Opening', 'Currency','Amount', 'Rate', 'Period', 'LastPayout',], 
        colWidths: [21, ]
    });
    let funding_loaning = await check_all_funding_loans(offer_currency)
    if (funding_loaning != 0) {
        for (let i = 0; i < funding_loaning.amount.length ; i++){
            let funding_loaning_rate365 = funding_loaning.rate[i]*365
            funding_loaning_rate365 = (funding_loaning_rate365.toFixed(4) *100) + '%'
            t.push([
                funding_loaning.mtsCreate[i],
                funding_loaning.symbol[i],
                funding_loaning.amount[i],
                funding_loaning_rate365,
                funding_loaning.period[i],
                funding_loaning.mtsUpdate[i],
            ])
        }
    }

    const t1 = new Table({
        head: ['Opening', 'Currency','Amount', 'Rate', 'Period', 'LastPayout',], 
    });
    let funding_offers = await check_funding_offers(offer_currency)
    if (funding_offers != 0) {
        for (let i = 0; i < funding_offers.amount.length ; i++){
            t1.push([
                funding_offers.mtsCreate[i],
                funding_offers.symbol[i],
                funding_offers.amount[i],
                funding_offers.rate[i],
                funding_offers.period[i],
                funding_offers.mtsUpdate[i],
            ])
        }
    }

	console.log(' ———————————————————————————————— 已提供 —————————————————————————————————');
    console.log(t.toString())
    console.log();
	console.log(' ———————————————————————————————— 掛單中 —————————————————————————————————');
    console.log(t1.toString())
    console.log();
	console.log(' ———————————————————————————————— 剩餘數量 —————————————————————————————————');
    console.log(remaining_balance)
}

setInterval(function(){render_overview(offer_currency)}, 10000);