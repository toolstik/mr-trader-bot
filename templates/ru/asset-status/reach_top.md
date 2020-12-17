{{> ru/asset-status/header}}

{{#with marketData}}
Пробитие {{donchian.maxDays}}-дневный MAX

Текущее значение: {{price}} {{asset.currencySymbol}}
{{donchian.maxDays}}-дневный MAX: {{donchian.maxValue}} {{asset.currencySymbol}}
Stop-loss: {{stopLoss}} {{asset.currencySymbol}}
Разница: 0,00 %
{{/with}}


