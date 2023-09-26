import { control, latLng, map, tileLayer } from 'leaflet';
import { FeatureCollection, Point } from 'geojson';

import { PointData, initMap } from './itm.js';
import { FullscreenControl } from './fullscreen.js';

const datas: { [name: string]: FeatureCollection<Point, PointData> } = (
  window as unknown as {
    _itmMapData: { [name: string]: FeatureCollection<Point, PointData> };
  }
)['_itmMapData'];

const mapElement = document.querySelector<HTMLElement>('#itm-map');

if (mapElement === null) {
  throw new Error('Cannot find map host element');
}

const itmMap = map(mapElement, {
  center: latLng(18.788508387847443, 98.98573391088291),
  zoom: 15.6,
  zoomDelta: 0.2,
  zoomSnap: 0.1,
});

tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  minZoom: 10,
  attribution: '© OpenStreetMap',
}).addTo(itmMap);

control.scale().addTo(itmMap);

const featuresLayers = initMap(itmMap, datas);

const layerControl = control
  .layers(undefined, undefined, {
    collapsed: false,
  })
  .addTo(itmMap);

new FullscreenControl({
  position: 'topleft',
}).addTo(itmMap);

featuresLayers.forEach(([name, layer]) => {
  layerControl.addOverlay(layer, name);
});
