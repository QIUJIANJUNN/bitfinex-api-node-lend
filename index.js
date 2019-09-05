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

// const t = new Table({
//     head: ['Opening', 'Currency','Amount', 'Rate', 'Period', 'LastPayout',], 
//     colWidths: [21, ]
// });

// const t1 = new Table({
//     head: ['Opening', 'Currency','Amount', 'Rate', 'Period', 'LastPayout',], 
//     // colWidths: [10, 10, 20,]
// });



// bfxRest2.balances().then(res => console.log(res));
// console.log(apiKey)

// // //// 當前 fundingLoans 已提供 xxxx
// bfxRest2.fundingLoans('fBTC').then(fiu => {
//     fiu.forEach(fl => {
//     console.log(fl.amount)
//     })
// })

// // Wallets
// bfxRest2.wallets().then(res => {
//     res.forEach(res => {
//     console.log(res)
//     })
// })



//  // fundingbook ,okay
// const options = {'limit_asks': 2, 'limit_bids': 2}
// bfxRest1.fundingbook('USD', options, (err, res) => {
// 	if (err) console.log(err)
// 	console.log(res.asks)
// })

// // // 查詢funding 掛單ING, okay
// bfxRest2.fundingOffers('fBTC').then(fiu => {
//     fiu.forEach(fl => {
//     console.log(fl)
//     })
// })

// // // fundingCredits 已提供, okay
// bfxRest2.fundingCredits('fBTC').then(fiu => {
//     fiu.forEach(fl => {
//     console.log(fl)
//     // console.log(fl.amount)
//     })
// })


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
// get_funding_balance(offer_currency).then(r=>{
//     console.log(r)
// })

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



// // // fundingCredits 已提供, okay
// bfxRest2.fundingCredits('fBTC').then(fiu => {
//     fiu.forEach(fl => {
//     console.log(fl)
//     // console.log(fl.amount)
//     })
// })
// Check All funding Loans.已提供 okay
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
// check_all_funding_loans(offer_currency)
// .then(r => {
//     console.log(r)
// })

// Check All funding Loans amount.已提供數量 okay
function check_all_funding_loans_amount(offer_currency){
    return new Promise(function(resolve, reject){
        check_all_funding_loans(offer_currency).then(r =>{
            let amountTotal = 0
            for (let i = 0; i < r.amount.length; i++){
                amountTotal += r.amount[i]
            }
            // console.log(amountTotal)
            resolve(amountTotal)
            })
    })
}
// check_all_funding_loans_amount(offer_currency)
// .then(r => {
//     console.log(r)
// })







// Check funding Loans amount. ???
function check_funding_loans_amount(currency) {
    let currencyUpper = currency.toUpperCase()
    const fCurrency = `f${currencyUpper}`

    return bfxRest2.fundingLoans(fCurrency).then(res => {
        // console.log(res.amount)
        if(res.length == 0 ) {
            return 0
        }
        return res
        // return res[0].amount
        // res.map(res => {
        // console.log(res)
        //     return res
        // })
    })
}
// check_funding_loans_amount('BTC')
// .then(r => {
//     console.log(r)
// })


// Check funding Offers amount xxx
function check_funding_offers_amount(currency) {
    let currencyUpper = currency.toUpperCase()
    const fCurrency = `f${currencyUpper}`

    return bfxRest2.fundingOffers(fCurrency).then(res => {
        // res.forEach(res => {
        // console.log(res.amount)
        // return res[1].amount
        // })
    })
}
// check_funding_offers_amount('btc')
// .then(r => {
//     console.log(r)
// })

// Check funding Offers 掛單中, ok
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
// check_funding_offers('btc')
// .then(r => {
//     console.log(r)

//     // let amountTotal = 0
//     // for (let i = 0; i < r.amount.length; i++){
//     //     amountTotal += r.amount[i]
//     // }
//     // console.log(amountTotal)
// })

// Offers amount, okay
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
            // console.log(amountTotal)
            
            })
    })
}
// check_funding_offers_amount(offer_currency)
// .then(r => {
//     console.log(r)
// })




// Gat available_amount,可用金額 okay
const get_available_amount = async(currency)  => {
    let funding_balance = await get_funding_balance(currency)
    
    let funding_loans_amount =  await check_all_funding_loans_amount(currency)
    let funding_offers_amount = await check_funding_offers_amount(currency)
    // console.log(`${funding_balance} - ${funding_loans_amount} - ${funding_offers_amount}`)
    let available_amount = funding_balance - funding_loans_amount - funding_offers_amount
    return available_amount
    // return Math.floor(available_amount * 100) / 100
}
// get_available_amount('btc')
// .then(r => {
//     console.log(r)
// })




// Get funding book.
function get_funding_book(currency, limit_asks, limit_bids) {
    const options = {'limit_asks':limit_asks , 'limit_bids': limit_bids}
    return new Promise(function(resolve, reject) {
        // const data = {
        //         ask:[],
        //         bid:[],
        //     }
        bfxRest1.fundingbook(currency, options, (err, res) => {
            if (err) console.log(err)
            
            // ttt1.push(res.bids)
            // console.log(`bid: ${res.bids[0].rate/365}`)
            // console.log(`ask: ${res.asks[0].rate/365}`)
            // console.log(res)
            // data.ask = res.asks[0]
            // console.log(`217: ${data.ask}`)
            // ttt1 = res
            // return res.bids
            // return res
            resolve(res)
            // resolve(data)
            
        })
        
        
    })
    
}
// get_funding_book('BTC',1,1)
// .then(r => {
//     console.log(r.bids)
//     console.log(`rate: ${r.bids[0].rate}`)
//     console.log(`amount: ${r.bids[0].amount}`)
//     console.log(`period: ${r.bids[0].period}`)
// })





// funding credits
function offer_a_funding(currency, amount, rate, period, direction, cb){
    return new Promise(function(resolve, reject) {
        return bfxRest1.new_offer(currency, amount, rate, period, direction, (err, res) => {
            if (err) console.log(err)
            resolve(res)
        })
    })
} 
// offer_a_funding('BTC', '0.01', '5',2,'lend')
// .then(r => {
//     console.log(r)
// })





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
// check_price('BTC')
// .then(r => {
//     console.log(r)
// })


// Check balance, if possible send amount. okay
const checkIfPoss = async(currency)  => {
    let balance = await get_available_amount(currency)
    let price =  await check_price(currency)
    // let total = Math.floor(balance * price.last_price * 100) / 100
    let total = Number(balance) * Number(price.last_price)
    if(total >= offer_minimum) {
        return balance
    } else {
        // console.log(total)
        return {
            'balance': balance,
            'total': total,
        }
    }  
}
// checkIfPoss(offer_currency)
// .then(r => {
//     console.log(r)
// })








// Renders an overview.
// offer_currency = 

const render_overview = async(offer_currency)  => {
    console.clear();
    console.log();
	console.log(' ————————————————————————— XiaoJi BITFINEX LENDING BOT —————————————————————————');
	console.log();

    const ba = await checkIfPoss(offer_currency)
    // console.log(typeof(ba))
    let remaining_balance = 0
    if (typeof ba === 'number'){
        // console.log(ba)
        const funding_book = await get_funding_book(offer_currency,1,1)
        let funding_r = funding_book.bids[0].rate
        funding_r = '36.5'
        let funding_a = funding_book.bids[0].amount
        let funding_p = funding_book.bids[0].period
        let check_amount = ''
        if(funding_a < ba) {
            check_amount = String(funding_a)
            // 這裡要加一個再次運行 checkIfPoss 
        } else {
            check_amount = String(ba)
        }
        await offer_a_funding(offer_currency, check_amount, funding_r, funding_p, 'lend')
    } else {
        // console.log(ba.balance)
        remaining_balance = ba.balance
    }
    const t = new Table({
        head: ['Opening', 'Currency','Amount', 'Rate', 'Period', 'LastPayout',], 
        colWidths: [21, ]
    });
    let funding_loaning = await check_all_funding_loans(offer_currency)
    if (funding_loaning != 0) {
        for (let i = 0; i < funding_loaning.amount.length ; i++){
            t.push([
                funding_loaning.mtsCreate[i],
                funding_loaning.symbol[i],
                funding_loaning.amount[i],
                funding_loaning.rate[i],
                funding_loaning.period[i],
                funding_loaning.mtsUpdate[i],
            ])
        }
    }

    const t1 = new Table({
        head: ['Opening', 'Currency','Amount', 'Rate', 'Period', 'LastPayout',], 
        // colWidths: [10, 10, 20,]
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

