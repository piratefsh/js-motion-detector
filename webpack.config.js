var path = require('path'),
    ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    entry: {
        app: ['./app/index.js']
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        publicPath: '/',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            // Babel loader
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel?optional[]=runtime'
            },
            // CSS loader
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
            // SASS/SCSS
            {
                test: /\.(sass|scss)$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader')
            }
        ]
    },
    resolve: {
        // where to find modules
        modulesDirectories: [
            'node_modules',
            'resources',
            'app'
        ],
        extensions: ['.js', '.json', '']
    },
    plugins: [
        new ExtractTextPlugin('styles.css')
    ]
}