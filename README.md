# bitfinex-api-node-lend

## 畫面顯示範例
![](https://firebasestorage.googleapis.com/v0/b/blog-1f60b.appspot.com/o/index_js_%E2%80%94_bitfinex-api-node-lend.png?alt=media&token=c7b7d14e-207d-4e64-99bb-99640b0b227b)


## 放貸幣種
BTC
<br>

## 放貸條件
放貸給想借錢的人。因為當前市場不是牛走熊，不會有突然超高的利率，因此“掛著等待借錢”與“掛著等人借錢”的利率相差不會太大。
<br>
如果“掛著等人借錢“*120% 比 “掛著等待借錢” 高時，使用“掛著等人借錢”的匯率。
![](https://firebasestorage.googleapis.com/v0/b/blog-1f60b.appspot.com/o/1*CavSuiyU2lNzXzuX-CIWyg.png?alt=media&token=010335f4-08f7-4833-89b3-876e23c51106)
<br>

## 更新時間
每10秒更新一次
<br>

## 使用方法
### 1. 添加 API Key
#### 將index.js 的
```JavaScript
const apiKey = require("./config/apiKey").apiKey;
const apiSecret = require("./config/apiKey").apiSecret;
```

#### 更改為
```JavaScript
const apiKey = 'xxxxxxxxxxxxxxxxxxx';
const apiSecret = 'xxxxxxxxxxxxxxxxxxx';
```

### 2. 設定收益計算起使日
```JavaScript
const lending_start_date = '2019-09-10'
```

### 3. 執行

```JavaScript
node index.js
```



