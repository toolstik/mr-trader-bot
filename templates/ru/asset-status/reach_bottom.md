{{> ru/asset-status/header}}

{{#with marketData}}
Пробитие {{donchian.minDays}}-дневный MIN

Текущее значение: {{price}} {{asset.currencySymbol}}
{{donchian.minDays}}-дневный MIN: {{donchian.minValue}} {{asset.currencySymbol}}
Take-profit: {{takeProfit}} {{asset.currencySymbol}}
Разница: 0,00 %
{{/with}}

