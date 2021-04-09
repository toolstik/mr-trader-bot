Статистика сигналов по [{{ticker}}](https://finance.yahoo.com/quote/{{ticker}})

{{#*inline "myPartial"}}
в плюс - {{positive.count}} ({{formatSign (percent positive.profit)}}%)
в минус - {{negative.count}} ({{formatSign (percent negative.profit)}}%)
*всего - {{total.count}} ({{formatSign (percent total.profit)}}%)*
{{/inline}}
Пробитие MAX:
{{> myPartial signals.top}}

Пробитие MIN:
{{> myPartial signals.bottom}}

Пробития ВСЕ:
{{> myPartial signals.total}}
