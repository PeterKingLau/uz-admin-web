module.exports = {
    plugins: [
        require('@tailwindcss/postcss'),
        require('autoprefixer'),
        {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
                charset: atRule => {
                    if (atRule.name === 'charset') atRule.remove()
                }
            }
        }
    ]
}
