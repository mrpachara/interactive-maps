import { Control, DomUtil, control, latLng, map, tileLayer } from 'leaflet';
import { FeatureCollection, Point } from 'geojson';

import { PointData, initMap, updateMapLayer } from './itm.js';
import { FullscreenControl } from './fullscreen.js';

class GeoJsonControl extends Control {
  onAdd(): HTMLElement {
    const button = DomUtil.create('button', 'itm-cmd-show-geojson');
    button.type = 'button';

    button.textContent = 'GeoJSON';

    return button;
  }
}

const datas: { [name: string]: FeatureCollection<Point, PointData> } = {
  'App 1': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Hua Lin Corner',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bibliothekar_d2.png',
          iconAnchor: [0, 0],
          status: 'unvisited',
          stampIcon:
            'https://leafletjs.com/examples/custom-icons/leaf-orange.png',
          stampIconSize: [19, 47.5],
          stampIconAnchor: [16, -16],
        },
        geometry: {
          type: 'Point',
          coordinates: [98.97843046568343, 18.795802382924858],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Si Phum Corner',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Bibliothek1.png',
          status: 'remote-visited',
          stampIcon: 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
          actionUrl: 'https://www.google.com',
        },
        geometry: {
          type: 'Point',
          coordinates: [98.99379737026106, 18.795321468827243],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Katam Corner',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Bibliotheksnutzung1.png',
          status: 'visited',
          stampIcon:
            'https://leafletjs.com/examples/custom-icons/leaf-green.png',
        },
        geometry: {
          type: 'Point',
          coordinates: [98.99286005344851, 18.781140158684252],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Ku Hueang Corner',
          status: 'remote-visited',
          stampIcon: 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
        },
        geometry: {
          type: 'Point',
          coordinates: [98.97772046837895, 18.78161367485324],
        },
      },
    ],
  },
  'App 2': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Test 02-01',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bibliothekar_d2.png',
          iconAnchor: [0, 0],
          status: 'unvisited',
          stampIcon:
            'https://leafletjs.com/examples/custom-icons/leaf-orange.png',
          stampIconSize: [19, 47.5],
          stampIconAnchor: [16, -16],
        },
        geometry: {
          type: 'Point',
          coordinates: [98.98277432618339, 18.791314587744008],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Test 02-02',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Bibliothek1.png',
          status: 'remote-visited',
          stampIcon: 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
          actionUrl: 'https://www.google.com',
        },
        geometry: {
          type: 'Point',
          coordinates: [98.98869174363047, 18.79088366351328],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Test 02-03',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Bibliotheksnutzung1.png',
          status: 'visited',
          stampIcon:
            'https://leafletjs.com/examples/custom-icons/leaf-green.png',
        },
        geometry: {
          type: 'Point',
          coordinates: [98.9851109474317, 18.788298094971786],
        },
      },
    ],
  },
  'App 3': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Test 02-01',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bibliothekar_d2.png',
          iconAnchor: [0, 0],
          status: 'unvisited',
          stampIcon:
            'https://leafletjs.com/examples/custom-icons/leaf-orange.png',
          stampIconSize: [19, 47.5],
          stampIconAnchor: [16, -16],
        },
        geometry: {
          type: 'Point',
          coordinates: [98.98547509619769, 18.78620088244317],
        },
      },
    ],
  },
};

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

new GeoJsonControl().addTo(itmMap);

let featuresLayers = initMap(itmMap, datas);

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
        const data = JSON.parse(dataText);
        const dataElement =
          target.querySelector<HTMLInputElement>('[name="data"]');
        if (dataElement) {
          const defaultValue = JSON.stringify(data, undefined, 2);
          dataElement.defaultValue = defaultValue;
          dataElement.value = defaultValue;
        }

        featuresLayers.forEach(([, layer]) => {
          layerControl.removeLayer(layer);
        });
        featuresLayers = updateMapLayer(itmMap, data, featuresLayers);

        featuresLayers.forEach(([name, layer]) => {
          layerControl.addOverlay(layer, name);
        });

        // refreshFeaturesLayers(featuresLayers);
        // recenterMap(itmMap, featuresLayers);
      }
    }
  });
