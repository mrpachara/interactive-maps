import { Control, DomUtil } from 'leaflet';

import {
  FeaturesLayersMapsData,
  createSimpleMap,
  updateSimpleMap,
} from './modules/simple-map.js';

class GeoJsonControl extends Control {
  onAdd(): HTMLElement {
    const button = DomUtil.create('button', 'itm-cmd-show-geojson');
    button.type = 'button';

    button.textContent = 'GeoJSON';

    return button;
  }
}

const datas: FeaturesLayersMapsData | null = JSON.parse(
  document.querySelector<HTMLScriptElement>('#itm-map-data')?.textContent ||
    'null',
);

if (datas === null) {
  throw new Error('Cannot find features data');
}

const dataElement = document.querySelector<HTMLInputElement>(
  'form#itm-geojson-form [name="data"]',
);

if (dataElement) {
  const defaultValue = JSON.stringify(datas, undefined, 2);

  dataElement.defaultValue = defaultValue;
  dataElement.value = defaultValue;
}

const mapElement = document.querySelector<HTMLElement>('#itm-map');

if (mapElement === null) {
  throw new Error('Cannot find map host element');
}

const itmMap = await createSimpleMap(mapElement, datas, [new GeoJsonControl()]);

document.addEventListener('click', (ev) => {
  const target = ev.target as Element | null;

  if (target?.matches('.itm-cmd-show-geojson')) {
    document
      .querySelector<HTMLDialogElement>('dialog#itm-geojson-dialog')
      ?.showModal();
  }
});

document
  .querySelector('form#itm-geojson-form [name="data"]')
  ?.addEventListener('change', (ev) => {
    const target = ev.target as HTMLInputElement | null;

    if (target) {
      target.setCustomValidity('');
      try {
        JSON.parse(target.value);
      } catch {
        target.setCustomValidity('Invalid JSON format');
      }
    }
  });

document
  .querySelector('form#itm-geojson-form')
  ?.addEventListener('reset', (ev) => {
    const target = ev.target as HTMLFormElement | null;

    if (target) {
      target
        .querySelector<HTMLInputElement>('[name="data"]')
        ?.setCustomValidity('');
    }
  });

document
  .querySelector('form#itm-geojson-form')
  ?.addEventListener('submit', (ev) => {
    const target = ev.target as HTMLFormElement | null;

    if (target) {
      const formData = new FormData(target);

      const dataText = formData.get('data');
      if (typeof dataText === 'string') {
        const datas = JSON.parse(dataText);
        const dataElement =
          target.querySelector<HTMLInputElement>('[name="data"]');
        if (dataElement) {
          const defaultValue = JSON.stringify(datas, undefined, 2);
          dataElement.defaultValue = defaultValue;
          dataElement.value = defaultValue;
        }

        updateSimpleMap(itmMap, datas);
      }
    }
  });
