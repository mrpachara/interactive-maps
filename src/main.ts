import './style.scss';
import 'leaflet/dist/leaflet.css';

import { divIcon, geoJSON, latLng, map, marker, tileLayer } from 'leaflet';
import { FeatureCollection } from 'geojson';

document.addEventListener('click', (ev) => {
  const target = ev.target as Element | null;

  if (target?.matches('.itm-cmd-show-geojson')) {
    document
      .querySelector<HTMLDialogElement>('dialog#itm-geojson-dialog')
      ?.showModal();
  }
});

const mymap = map('itm-map', {
  center: latLng(18.788508387847443, 98.98573391088291),
  zoom: 16,
});

tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap',
}).addTo(mymap);

// marker(latLng(18.788508387847443, 98.98573391088291), {
//   icon: icon({
//     iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
//     //shadowUrl: 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png',

//     iconSize: [38, 95], // size of the icon
//     //shadowSize: [50, 64], // size of the shadow
//     iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
//     //shadowAnchor: [4, 62], // the same for the shadow
//     popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
//   }),
// })
//   .bindPopup('My Test')
//   .bindTooltip('<b>Custom Image</b>', {
//     permanent: true,
//     direction: 'center',
//     className: 'cl-float',
//   })
//   .addTo(mymap);

/*
18.795802382924858, 98.97843046568343     18.795321468827243, 98.99379737026106
18.781613674853240, 98.97772046837895      18.781140158684252, 98.99286005344851
*/

const data: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Hua Lin Corner',
        pointIcon:
          'https://www.shareicon.net/data/48x48/2015/10/17/657581_character_512x512.png',
        status: 0,
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
        pointIcon:
          'https://www.shareicon.net/data/48x48/2015/11/01/665326_china_512x512.png',
        status: 1,
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
        pointIcon:
          'https://www.shareicon.net/data/48x48/2015/10/18/658021_silhouette_512x512.png',
        status: 2,
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
        status: 1,
      },
      geometry: {
        type: 'Point',
        coordinates: [98.97772046837895, 18.78161367485324],
      },
    },
  ],
};

(() => {
  const dataElement = document.querySelector<HTMLInputElement>(
    'form#itm-geojson-form [name="data"]',
  );

  if (dataElement) {
    const defaultValue = JSON.stringify(data, undefined, 2);

    dataElement.defaultValue = defaultValue;
    dataElement.value = defaultValue;
  }
})();

const featuresLayer = geoJSON(data, {
  pointToLayer: (feature, pointLatLng) => {
    const { properties } = feature;
    const status: number = properties?.status ?? 0;
    const statusUrl =
      status === 2
        ? 'https://leafletjs.com/examples/custom-icons/leaf-green.png'
        : status === 1
        ? 'https://leafletjs.com/examples/custom-icons/leaf-red.png'
        : 'https://leafletjs.com/examples/custom-icons/leaf-orange.png';

    return marker(pointLatLng, {
      icon: divIcon({
        html: `<div
          class="itm-cmp-marker-content"
          style="--itm-image: url(${
            properties?.pointIcon ??
            'https://www.shareicon.net/data/48x48/2015/12/28/694658_temple_512x512.png'
          })"
        >
          <img src="${statusUrl}" alt="stauts is ${status}" />
        </div>`,
        className: 'itm-cmp-marker',
        iconSize: [64, 64],
        iconAnchor: [32, 32],
        popupAnchor: [0, -32],
      }),
    });
  },

  onEachFeature: (feature, layer) => {
    const { properties } = feature;
    const status: number = properties?.status ?? 0;
    const actionUrl: string | undefined = properties?.actionUrl;

    const actionLink = actionUrl
      ? `
      <a href="${actionUrl}">Play</a>
    `
      : '';

    layer.bindPopup(`
      <header>
        <b>${properties?.name ?? 'Unknown'}</b>
      </header>
      <dl class="itm-cmp-data-view">
        <dt>Status</dt>
        <dd>${status}</dd>
      </dl>
      <div>
        ${actionLink}
      </div>
    `);
  },
}).addTo(mymap);

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
        featuresLayer.clearLayers();
        featuresLayer.addData(data);
      }
    }
  });
