// @flow

'use strict';

import maplibregl from 'maplibre-gl'

import MBTilesSource from './mbtiles_source'
import RasterTileSourceOffline from "./raster_tile_offline_source"
import {extend} from 'maplibre-gl/src/util/util'
import window from 'maplibre-gl/src/util/window'

const readJSON = (url) => new Promise((resolve, reject) => {

    const xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onerror = (e) => reject(e);
    xhr.onload = () => {
        const isFile = xhr.responseURL.indexOf('file://') === 0;
        if (((xhr.status >= 200 && xhr.status < 300) || isFile) && xhr.response) {

            console.log( "OfflineMap.readJSON(): attemptingt to parse:", xhr.response );

            try {
                resolve(JSON.parse(xhr.response));
            } catch (err) {
                reject(err);
            }
        } else {
            reject(new Error(xhr.statusText, xhr.status));
        }
    };
    xhr.send();
    return xhr;
});

const dereferenceStyle = (options) => {
    if (typeof options.style === 'string' || options.style instanceof String) {
        return readJSON(options.style).then((style) => extend({}, options, {style: style}));
    } else {
        return Promise.resolve(options);
    }
};

const absoluteSpriteUrl = (options) => {
    const style = options.style;
    const hasProtocol = /^.+:\/\//;
    const path = window.location.origin;

    if (('sprite' in style) && !style.sprite.match(hasProtocol) &&
        ('glyphs' in style) && !style.glyphs.match(hasProtocol)) {
        style.sprite = path + '/' +  style.sprite; // eslint-disable-line prefer-template
        style.glyphs = path + '/' +  style.glyphs; // eslint-disable-line prefer-template
    }
    return options;
};

const createEmptyMap = (options) => new Promise( (resolve ) => {
    const emptyMapStyle = extend({}, options.style, {
        sources: {},
        layers: []
    });

    const emptyMapOptions = extend({}, options, {style: emptyMapStyle});
    const map = new maplibregl.Map( emptyMapOptions );

    map.once( 'load', () => {

        console.log( "OfflineMap.createEmptyMap(): load once callback caught." );

        let mbTilesSourceLoaded = new Promise((resolve) => {
            map.addSourceType( 'mbtiles', MBTilesSource, () => resolve() )
        });

        let rasterOfflineSourceLoaded = new Promise((resolve) => {
            map.addSourceType( 'rasteroffline', RasterTileSourceOffline, () => resolve() )
        });

        Promise.all([mbTilesSourceLoaded, rasterOfflineSourceLoaded]).then( () => {

          console.log( "OfflineMap.createEmptyMap(): map resolved.", map );
          resolve( map );

        });
    });
});

const loadSources = (style) => (map) => {

    console.log( "index.html: loading sources:", style.sources );

    Object.keys( style.sources ).map( (sourceName) => map.addSource(sourceName, style.sources[sourceName]) );
    return map;
};

const loadLayers = (style) => (map) => {

    console.log( "index.html: loading layers:", style.layers );

    style.layers.map((layer) => map.addLayer(layer));

    return map;
};

/**
* create offline map object
*/

const OfflineMap = (options) =>
    dereferenceStyle( options ).then( absoluteSpriteUrl ).then( (newOptions) =>
        createEmptyMap(newOptions)
            .then(loadSources(newOptions.style))
            .then(loadLayers(newOptions.style))

    );

export default OfflineMap
