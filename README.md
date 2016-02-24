# Motion Detector

![motion detector](http://i.imgur.com/db4bQPw.gifv)

p/s: gif was from before I introduced Web Workers. stream will now be smoother, but motion areas in `index.js` sample code will be more transient/flickery (drawn on later)

## Development 
### Install
```
npm install
npm install webpack-dev-server webpack -g
```

### Serve

To serve at http://localhost:8080/:

```
webpack-dev-server --inline  --content-base public/ 
```

### Build

To compile HTML/CSS and JavaScript files for production:

```
webpack --config webpack.config.js
```
