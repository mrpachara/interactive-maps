import './style.scss';
import 'leaflet/dist/leaflet.css';

import {
  GeoJSON,
  Map,
  PointTuple,
  divIcon,
  geoJSON,
  latLng,
  latLngBounds,
  marker,
} from 'leaflet';
import { Feature, FeatureCollection, Geometry, Point } from 'geojson';

export interface PointData {
  name?: string; // The name of point.
  status?: string; // The status of point.
  actionUrl?: string; // The URL of playing this point.
  icon?: string; // The URL for point icon.
  iconSize?: [number, number]; //The size of icon [width, height]. Default is [32, 32].
  iconAnchor?: [number, number]; //The icon anchor position [x, y] from icon top-left. Default is [width / 2, height / 2].
  popupAnchor?: [number, number]; //The popup anchor position [x, -y] from icon anchor position. Default is [0, -iconAnchor[1]].
  stampIcon?: string; // The URL of stamp icon.
  stampIconSize?: [number, number]; // The size of stamp icon [width, height]. Default is the original image size.
  stampIconAnchor?: [number, number]; //The stamp icon anchor position [x, -y] from the center of point. Default is [0, 0].
}

function getZoomRation(zoomLevel: number): number {
  return 2 ** (zoomLevel - 15);
}

const defaultIcon = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100">
  <circle cx="50" cy="50" r="48" stroke="black" stroke-width="2" fill="red" fill-opacity="0.75" />
</svg>
`)}` as const;

function adjustZoomScale(itmMap: Map): void {
  const mapElement = itmMap.getContainer();

  mapElement.style.setProperty(
    '--itm-zoom-ratio',
    `${getZoomRation(itmMap.getZoom())}`,
  );
}

export type FeaturesLayouts = (readonly [
  string,
  GeoJSON<PointData, Geometry>,
])[];

export function recenterMap(
  itmMap: Map,
  featuresLayers: FeaturesLayouts,
): void {
  const allowedFeaturs = featuresLayers
    .filter(([, layer]) => itmMap.hasLayer(layer))
    .reduce(
      (result, entry) => {
        const layer = entry[1];
        const featureColleciton = layer.toGeoJSON() as FeatureCollection<
          Point,
          PointData
        >;
        return result.concat(featureColleciton.features);
      },
      [] as Feature<Point, PointData>[],
    );

  if (allowedFeaturs.length === 0) {
    return;
  }

  const bounds: [[number, number], [number, number]] = allowedFeaturs.reduce(
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

  itmMap.flyToBounds(
    latLngBounds([latLng(...bounds[0]), latLng(...bounds[1])]),
    {
      padding: [64, 64],
    },
  );
}

export function refreshFeaturesLayers(featuresLayers: FeaturesLayouts): void {
  featuresLayers.forEach(([, layer]) => {
    const data = layer.toGeoJSON();
    layer.clearLayers();
    layer.addData({ ...data });
  });
}

export function initMap(
  itmMap: Map,
  datas: { [name: string]: FeatureCollection<Point> },
) {
  adjustZoomScale(itmMap);

  const featuresLayers = updateMapLayer(itmMap, datas);

  return featuresLayers;
}

export function updateMapLayer(
  itmMap: Map,
  datas: { [name: string]: FeatureCollection<Point> },
  oldFeaturesLayers?: FeaturesLayouts,
) {
  const mapElement = itmMap.getContainer();

  if (oldFeaturesLayers) {
    oldFeaturesLayers.forEach(([, layout]) => {
      itmMap.removeLayer(layout);
    });
  }

  const featuresLayers = Object.entries(datas).map(
    ([name, data]) =>
      [
        name,
        geoJSON<PointData>(data, {
          pointToLayer: (feature, pointLatLng) => {
            const { properties } = feature;
            const status = properties?.status ?? 'unknown';
            const stampIcon = properties?.stampIcon ?? null;
            const stampIconSize: [number, number] | null =
              properties?.stampIconSize ?? null;
            const stampIconAnchor: [number, number] =
              properties?.stampIconAnchor ?? [0, 0];

            const zoomRatio = parseFloat(
              mapElement.style.getPropertyValue('--itm-zoom-ratio'),
            );
            const iconSize: PointTuple = (
              (properties?.iconSize ?? [32, 32]) as [number, number]
            ).map((value) => zoomRatio * value) as PointTuple;
            // const iconSize: PointTuple = properties?.iconSize ?? [32, 32];
            const iconAnchor: PointTuple =
              properties?.iconAnchor ??
              (iconSize.map((value) => value / 2) as [number, number]);
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
        }).addTo(itmMap),
      ] as const,
  );

  let recenterMapHandler: number | null = null;

  const recenterMapListener = () => {
    if (recenterMapHandler !== null) {
      clearTimeout(recenterMapHandler);
    }

    recenterMapHandler = setTimeout(() => {
      recenterMap(itmMap, featuresLayers);
    }, 100) as unknown as number;
  };

  featuresLayers.forEach(([, layout]) => {
    layout.on('add', recenterMapListener);
    layout.on('remove', recenterMapListener);
    layout.on('zoomend', () => refreshFeaturesLayers(featuresLayers));
  });

  recenterMap(itmMap, featuresLayers);

  itmMap.removeEventListener('zoomend');

  itmMap.on('zoomend', () => {
    //console.debug(itmMap.getZoom());
    adjustZoomScale(itmMap);

    refreshFeaturesLayers(featuresLayers);
  });

  return featuresLayers;
}
