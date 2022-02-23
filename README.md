# Offline vector maps in Capacitor using MapLibre GL JS

A maplibre-gl-js build capable of reading local mbtiles in Capacitor.
Tested on Android, and (to a lesser extent) on iOS.


## Run example application

```
npm install
npx cap add android | ios
npm run build-dev
npx cap sync
npx cap run android | ios
```

Will use `www/data/2017-07-03_spain_barcelona.mbtiles` as sample data source, and `www/styles/osm-bright/style-offline.json`
as style, both coming from the OpenMapTiles project: https://openmaptiles.org/

## Integrate in your application

Use the bundled library from `www/maplibre-gl-capacitor-offline.js` which is based in maplibre-gl-js v.1.15.2, or install it
as npm dependency (`npm install @yermo/maplibre-gl-capacitor-offline`).

This project relies on these legacy cordova plugins:

    * "cordova-plugin-device"
    * "cordova-plugin-file"
    * "cordova-sqlite-ext"

Use the OfflineMap constructor. It returns a **promise** instead of a map, as the
offline map creation process is asynchronous:
  
```javascript
       new maplibregl.OfflineMap({
            container: 'map',
            style: 'styles/osm-bright/style-offline.json'
       }).then(function(map) {
           map.addControl(new maplibregl.NavigationControl());
       });
```

See `www/index.html` in this repo for a working example.

### Offline data sources (mbtiles)

In your style, you can specify offline tile sources specifying `mbtiles` as the source type,
and the location to the mbtiles file as a relative path:

```json
"sources": {
    "openmaptiles": {
        "type": "mbtiles",
        "path": "data/2017-07-03_spain_barcelona.mbtiles"
    }
}
```

Additional styles can be found in OpenMapTiles repos (see gh-pages branches): https://github.com/openmaptiles
Vector tiles for other regions can be downloaded here: https://openmaptiles.com/downloads/planet/

#### Raster tiles

You can add raster tiles in offline mode. In the style you have to add a new source with type `rasteroffline` with the 
relative path:

```json
"sources": {
    "hillshading": {
        "type": "rasteroffline",
        "path": "data/2016-11-28-hillshade-spain_barcelona.mbtiles"
    }
}
```

The style related to this source will be the same that a common Mapbox raster layer. You have to relate the layer with
the source using the source name, and the type of the layer have to be `raster` as a common raster Mapbox layer.

```json
{
      "id": "hillshading",
      "type": "raster",
      "source": "hillshading",
      "layout": {
        "visibility": "visible"
      },
      "paint": {
        "raster-opacity": {
          "base": 0.5,
          "stops": [
            [
              3,
              0
            ],
            [
              5,
              0.5
            ],
            [
              12,
              0.5
            ]
          ]
        },
        "raster-fade-duration": 300,
        "raster-contrast": 0
      }
    }
```

### Offline sprites (icon set) 

Copy the files `sprite.json`, `sprite.png`, `sprite@2x.json` and `sprite@2x.png` as local resources and
reference them as a relative path in your style:

```json
"sprite": "styles/osm-bright/sprite"
```


### Offline glyphs (fonts) 

Search "text-font" attributes in your style. Download the needed fonts from https://github.com/openmaptiles/fonts
(see gh-pages branch) and copy them locally. Set the relative path in the "glyphs" property of the
style:

```json
"glyphs": "fonts/{fontstack}/{range}.pbf"
```

### Enabling console.log

To enable console.log statements, comment out the strip() call in rollup.config.js
