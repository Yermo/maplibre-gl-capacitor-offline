import fs from 'fs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import {plugins} from './build/rollup_plugins';
import strip from '@rollup/plugin-strip';

const version = JSON.parse(fs.readFileSync('package.json')).version;
const {BUILD, MINIFY} = process.env;
const minified = MINIFY === 'true';
const production = BUILD === 'production';
const outputFile =
    !production ? 'www/maplibre-gl-capacitor-offline-dev.js':
    minified ? 'www/maplibre-gl-capacitor-offline.js'  : 'www/maplibre-gl-capacitor-offline-unminified.js';

const config = [{
    // First, use code splitting to bundle GL JS into three "chunks":
    // - rollup/build/index.js: the main module, plus all its dependencies not shared by the worker module
    // - rollup/build/worker.js: the worker module, plus all dependencies not shared by the main module
    // - rollup/build/shared.js: the set of modules that are dependencies of both the main module and the worker module
    //
    // This is also where we do all of our source transformations: removing
    // flow annotations, transpiling ES6 features using buble, inlining shader
    // sources as strings, etc.
    input: ['src/index.js', 'src/worker.js'],
    output: {
        dir: 'rollup/build/maplibregl',
        format: 'amd',
        sourcemap: 'inline',
        indent: false,
        chunkFileNames: 'shared.js'
    },
    experimentalCodeSplitting: true,
    treeshake: production,
    plugins: plugins()
}, {
    // Next, bundle together the three "chunks" produced in the previous pass
    // into a single, final bundle. See rollup/bundle_prelude.js and
    // rollup/mapboxgl.js for details.
    input: 'rollup/maplibregl.js',
    output: {
        name: 'maplibregl',
        file: outputFile,
        format: 'umd',
        sourcemap: production ? true : 'inline',
        indent: false,
        intro: fs.readFileSync(require.resolve('./rollup/bundle_prelude.js'), 'utf8'),
        banner: `/* Mapbox GL JS is licensed under the 3-Clause BSD License. Full text of license: https://github.com/mapbox/mapbox-gl-js/blob/v${version}/LICENSE.txt */`
    },
    treeshake: false,
    plugins: [

        // Comment this out to include console.log statements

        strip(),

        // Ingest the sourcemaps produced in the first step of the build.
        // This is the only reason we use Rollup for this second pass
        sourcemaps()
    ],
}];

export default config
