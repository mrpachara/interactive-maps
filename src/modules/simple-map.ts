import {
  Control,
  Map as LeafLetMap,
  control,
  latLng,
  map,
  tileLayer,
} from 'leaflet';
import { FeatureCollection, Point } from 'geojson';

import {
  FeaturesLayouts,
  PointData,
  updateFeaturesLayers,
} from './features-layers.js';
import { FullscreenControl } from '../controls/fullscreen.js';
import { getCurrentLocation } from '../utils.ts/location.js';

const defaultCenter = latLng(18.788508387847443, 98.98573391088291);

const defaultZoom = 15.6 as const;
const defaultZoomDelta = 0.2 as const;
const defaultZoomSnap = 0.1 as const;

const stateMap = new Map<
  LeafLetMap,
  {
    featuresLayers: FeaturesLayouts;
    layersControl: Control.Layers;
  }
>();

export type FeaturesLayersMapsData = {
  [name: string]: FeatureCollection<Point, PointData>;
};

export async function createSimpleMap(
  mapElement: HTMLElement,
  datas: FeaturesLayersMapsData,
  initialControls?: Control[],
): Promise<LeafLetMap> {
  const center = await getCurrentLocation()
    .then((pos) => latLng(pos.coords.latitude, pos.coords.longitude))
    .catch(() => defaultCenter);

  const leftLetMap = map(mapElement, {
    center: center,
    zoom: defaultZoom,
    zoomDelta: defaultZoomDelta,
    zoomSnap: defaultZoomSnap,
  });

  tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 10,
    attribution: '© OpenStreetMap',
  }).addTo(leftLetMap);

  (initialControls ?? []).forEach((control) => leftLetMap.addControl(control));

  control.scale().addTo(leftLetMap);

  const featuresLayers = updateFeaturesLayers(leftLetMap, datas);

  const layersControl = control
    .layers(undefined, undefined, {
      collapsed: false,
    })
    .addTo(leftLetMap);

  new FullscreenControl({
    position: 'topleft',
  }).addTo(leftLetMap);

  featuresLayers.forEach(([name, layer]) => {
    layersControl.addOverlay(layer, name);
  });

  stateMap.set(leftLetMap, {
    featuresLayers,
    layersControl,
  });

  return leftLetMap;
}

export function updateSimpleMap(
  leftLetMap: LeafLetMap,
  datas: FeaturesLayersMapsData,
): void {
  const stateData = stateMap.get(leftLetMap);

  if (typeof stateData === 'undefined') {
    throw new Error('The map is not initialized yet');
  }

  stateData.featuresLayers.forEach(([, layer]) => {
    stateData.layersControl.removeLayer(layer);
  });

  stateData.featuresLayers = updateFeaturesLayers(leftLetMap, datas);

  stateData.featuresLayers.forEach(([name, layer]) => {
    stateData.layersControl.addOverlay(layer, name);
  });
}
