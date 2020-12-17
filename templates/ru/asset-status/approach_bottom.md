{{> ru/asset-status/header}}

{{#with marketData}}
Приближение к порогу {{donchian.minDays}}-дневный MIN

Текущее значение: {{price}} {{asset.currencySymbol}}
{{donchian.minDays}}-дневный MIN: {{donchian.minValue}} {{asset.currencySymbol}}
Take-profit: {{takeProfit}} {{asset.currencySymbol}}
Разница: 0,00 %
{{/with}}


