module.exports = {
    extends: [
        'stylelint-config-standard',
        'stylelint-config-recommended-vue',
        'stylelint-config-prettier'
    ],
    overrides: [
        {
            files: ['**/*.{vue,html}'],
            customSyntax: 'postcss-html'
        }
    ],
    rules: {
        'no-empty-source': null,
        'block-no-empty': null,
        'selector-class-pattern': null,
        'at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: ['tailwind', 'apply', 'layer', 'variants', 'responsive', 'screen']
            }
        ],
        'color-function-notation': 'modern',
        'alpha-value-notation': 'number',
        'font-family-no-missing-generic-family-keyword': null
    }
}
