Общая статистика сигналов по подписке

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

В работе:
- пробитие MAX: {{progress.top.count}}
- пробитие MIN: {{progress.bottom.count}}
- пробитие ВСЕ: {{progress.total.count}}
