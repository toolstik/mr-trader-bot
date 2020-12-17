{{> ru/asset-status/header}}

{{#with marketData}}
Приближение к порогу {{donchian.minDays}}-дневный MAX

Текущее значение: {{format price}} {{asset.currencySymbol}}
{{donchian.maxDays}}-дневный MAX: {{format donchian.maxValue}} {{asset.currencySymbol}}
Stop-loss: {{format stopLoss}} {{asset.currencySymbol}}
Разница: {{diff price donchian.maxValue}} %
{{/with}}


