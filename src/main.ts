import './style.scss';
import 'leaflet/dist/leaflet.css';

import {
  PointTuple,
  control,
  divIcon,
  geoJSON,
  latLng,
  latLngBounds,
  map,
  marker,
  tileLayer,
} from 'leaflet';
import { FeatureCollection, Point } from 'geojson';

function getZoomRation(zoomLevel: number): number {
  return 2 ** (zoomLevel - 15);
}

const defaultIcon = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100">
  <circle cx="50" cy="50" r="48" stroke="black" stroke-width="2" fill="red" fill-opacity="0.75" />
</svg>
`)}` as const;

document.addEventListener('click', (ev) => {
  const target = ev.target as Element | null;

  if (target?.matches('.itm-cmd-show-geojson')) {
    document
      .querySelector<HTMLDialogElement>('dialog#itm-geojson-dialog')
      ?.showModal();
  }
});

const mapElement = document.querySelector<HTMLElement>('#itm-map');

if (mapElement === null) {
  throw new Error('Map element not found');
}

const mymap = map(mapElement, {
  center: latLng(18.788508387847443, 98.98573391088291),
  zoom: 15.6,
  zoomDelta: 0.2,
  zoomSnap: 0.1,
});

const adjustZoomScale = (): void => {
  mapElement.style.setProperty(
    '--itm-zoom-ratio',
    `${getZoomRation(mymap.getZoom())}`,
  );
};

const recenter = (data: FeatureCollection<Point>): void => {
  if (data.features.length === 0) {
    return;
  }

  const bounds: [[number, number], [number, number]] = data.features.reduce(
    (results, feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      if (lat < results[0][0]) {
        results[0][0] = lat;
      }
      if (lng < results[0][1]) {
        results[0][1] = lng;
      }
      if (lat > results[1][0]) {
        results[1][0] = lat;
      }
      if (lng > results[1][1]) {
        results[1][1] = lng;
      }

      return results;
    },
    [
      [99999, 99999],
      [-99999, -99999],
    ], // [[minLat, minLng], [maxLat, maxLng]]
  );

  mymap.flyToBounds(
    latLngBounds([latLng(...bounds[0]), latLng(...bounds[1])]),
    {
      padding: [64, 64],
    },
  );
};

adjustZoomScale();

tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  minZoom: 10,
  attribution: '© OpenStreetMap',
}).addTo(mymap);

control.scale().addTo(mymap);

const data: FeatureCollection<Point> = {
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
        stampIcon: 'https://leafletjs.com/examples/custom-icons/leaf-green.png',
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
    // {
    //   type: 'Feature',
    //   properties: {
    //     name: 'CMU',
    //     status: 'remote-visited',
    //     stampIcon: 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
    //   },
    //   geometry: {
    //     type: 'Point',
    //     coordinates: [98.95199307655561, 18.802103324139367],
    //   },
    // },
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
    const status = properties?.['status'] ?? 'unknown';
    const stampIcon = (properties?.['stampIcon'] as string | undefined) ?? null;
    const stampIconSize: [number, number] | null =
      properties?.['stampIconSize'] ?? null;
    const stampIconAnchor: [number, number] = properties?.[
      'stampIconAnchor'
    ] ?? [0, 0];

    const zoomRatio = parseFloat(
      mapElement.style.getPropertyValue('--itm-zoom-ratio'),
    );
    const iconSize: PointTuple = (
      (properties?.iconSize ?? [32, 32]) as [number, number]
    ).map((value) => zoomRatio * value) as PointTuple;
    // const iconSize: PointTuple = properties?.iconSize ?? [32, 32];
    const iconAnchor: PointTuple =
      properties?.iconAnchor ?? iconSize.map((value) => value / 2);
    const popupAnchor: PointTuple = properties?.popupAnchor ?? [
      0,
      -iconAnchor[1],
    ];

    const stampElement = stampIcon
      ? `<img
          src="${stampIcon}"
          alt="stauts is ${status}"
          ${
            stampIconSize
              ? `width="${stampIconSize[0]}" height="${stampIconSize[1]}"`
              : ''
          }
          style="--itm-stamp-x: ${stampIconAnchor[0]}px; --itm-stamp-y: ${
            stampIconAnchor[1]
          }px;"
        />`
      : '';

    return marker(pointLatLng, {
      icon: divIcon({
        html: `<div
          class="itm-cmp-marker-content"
          style="--itm-image: url('${properties?.icon ?? defaultIcon}');"
        >
          ${stampElement}
        </div>`,
        className: 'itm-cmp-marker',
        iconSize,
        iconAnchor,
        popupAnchor,
      }),
    });
  },

  onEachFeature: (feature, layer) => {
    const { properties } = feature;
    const status: string = properties?.status ?? 'unknown';
    const actionUrl: string | undefined = properties?.actionUrl;

    const actionLink = actionUrl
      ? `
      <a href="${actionUrl}" target="_blank">Play</a>
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

recenter(data);

mymap.on('zoomend', () => {
  //console.debug(mymap.getZoom());
  adjustZoomScale();

  const data = featuresLayer.toGeoJSON();
  featuresLayer.clearLayers();
  featuresLayer.addData({ ...data });
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
        featuresLayer.clearLayers();
        featuresLayer.addData(data);
        recenter(data);
      }
    }
  });
