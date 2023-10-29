var path = require('path');

module.exports = {
    entry: './src/main/resources/static/built/app.js',
    devtool: 'source-map',
    cache: true,
    mode: 'development',
    output: {
        path: __dirname,
        filename: './src/main/resources/static/built/bundle.js',
        sourceMapFilename: "./src/main/resources/static/built/app.js.map"
    },
    module: {
        rules: [
            {
                test: path.join(__dirname, '.'),
                exclude: /(node_modules)/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }]
            }
        ]
    },
    resolve: {
        fallback: {
            net: false
        }
    },
};