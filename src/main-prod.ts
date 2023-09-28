import {
  FeaturesLayersMapsData,
  createSimpleMap,
} from './modules/simple-map.js';

const datas: FeaturesLayersMapsData | null = JSON.parse(
  document.querySelector<HTMLScriptElement>('#itm-map-data')?.textContent ||
    'null',
);

if (datas === null) {
  throw new Error('Cannot find features data');
}

const mapElement = document.querySelector<HTMLElement>('#itm-map');

if (mapElement === null) {
  throw new Error('Cannot find map host element');
}

await createSimpleMap(mapElement, datas);
