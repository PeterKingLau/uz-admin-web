import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier/flat'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'

const sourceFiles = ['**/*.{js,mjs,cjs,ts,tsx,vue}']

export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.vite-inspect/**', 'public/iconify/**', 'src/types/components.d.ts']
    },
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'warn'
        }
    },
    js.configs.recommended,
    ...vue.configs['flat/essential'],
    {
        files: sourceFiles,
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021
            }
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        }
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                extraFileExtensions: ['.vue']
            }
        }
    },
    {
        files: sourceFiles,
        rules: {
            'vue/html-self-closing': 'off',
            'vue/multi-word-component-names': 'off',
            'vue/no-deprecated-filter': 'warn',
            'vue/no-mutating-props': 'off',
            'vue/no-ref-as-operand': 'warn',
            'vue/no-reserved-component-names': 'warn',
            'vue/require-valid-default-prop': 'warn',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-prototype-builtins': 'warn',
            'no-unused-labels': 'warn',
            'no-useless-escape': 'warn',
            'no-useless-assignment': 'warn',
            'no-unused-vars': 'off',
            'no-undef': 'off'
        }
    },
    prettierConfig
]
