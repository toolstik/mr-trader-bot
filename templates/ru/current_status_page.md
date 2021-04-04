*Текущий статус: ({{pageNum}}/{{totalPages}})*

{{#each items}}
{{> ru/asset_link this}}
{{> ru/market_data this}}
SMA(50): {{format fundamentals.sma50}}
SMA(200): {{format fundamentals.sma200}}

{{/each}}
