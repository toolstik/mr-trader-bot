{{#eq status 'REACH_TOP'}}
{{> ru/asset-status/reach_top marketData}}
{{/eq}}
{{#eq status 'APPROACH_TOP'}}
{{> ru/asset-status/approach_top marketData}}
{{/eq}}
{{#eq status 'STOP_TOP'}}
{{> ru/asset-status/stop_top marketData}}
{{/eq}}
{{#eq status 'APPROACH_BOTTOM'}}
{{> ru/asset-status/approach_bottom marketData}}
{{/eq}}
{{#eq status 'REACH_BOTTOM'}}
{{> ru/asset-status/reach_bottom marketData}}
{{/eq}}
{{#eq status 'STOP_BOTTOM'}}
{{> ru/asset-status/stop_bottom marketData}}
{{/eq}}
{{#eq status 'NONE'}}
{{> ru/asset-status/none marketData}}
{{/eq}}
