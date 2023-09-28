import './features-layers.scss';

import {
  GeoJSON,
  Map as LeafLetMap,
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

export type FeaturesLayouts = (readonly [
  string,
  GeoJSON<PointData, Geometry>,
])[];

export const BASE_ZOOM = 15 as const;

const defaultIconSize = [32, 32] as const;

const defaultIcon = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100">
  <circle cx="50" cy="50" r="48" stroke="black" stroke-width="2" fill="red" fill-opacity="0.75" />
</svg>
`)}` as const;

const featuresLayoutsMap = new Map<LeafLetMap, FeaturesLayouts>();

function getZoomRation(zoomLevel: number): number {
  return 2 ** (zoomLevel - BASE_ZOOM);
}

function adjustZoomScale(flMap: LeafLetMap): void {
  const mapElement = flMap.getContainer();

  mapElement.style.setProperty(
    '--fl-zoom-ratio',
    `${getZoomRation(flMap.getZoom())}`,
  );
}

function createFeaturesLayers(
  flMap: LeafLetMap,
  datas: { [name: string]: FeatureCollection<Point> },
) {
  const mapElement = flMap.getContainer();

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
              mapElement.style.getPropertyValue('--fl-zoom-ratio'),
            );
            const iconSize: PointTuple = (
              (properties?.iconSize ?? defaultIconSize) as [number, number]
            ).map((value) => zoomRatio * value) as PointTuple;
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
                style="--fl-stamp-x: ${stampIconAnchor[0]}px; --fl-stamp-y: ${
                  stampIconAnchor[1]
                }px;"
              />`
              : '';

            return marker(pointLatLng, {
              icon: divIcon({
                html: `<div
                class="fl-cmp-marker-content"
                style="--fl-image: url('${properties?.icon ?? defaultIcon}');"
              >
                ${stampElement}
              </div>`,
                className: 'fl-cmp-marker',
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
            <dl class="fl-cmp-data-view">
              <dt>Status</dt>
              <dd>${status}</dd>
            </dl>
            <div>
              ${actionLink}
            </div>
          `);
          },
        }).addTo(flMap),
      ] as const,
  );

  let recenterMapHandler: number | null = null;

  const recenterMapListener = () => {
    if (recenterMapHandler !== null) {
      clearTimeout(recenterMapHandler);
    }

    recenterMapHandler = setTimeout(() => {
      recenterMap(flMap, featuresLayers);
    }, 100) as unknown as number;
  };

  featuresLayers.forEach(([, layout]) => {
    layout.on('add', recenterMapListener);
    layout.on('remove', recenterMapListener);
    layout.on('zoomend', () => refreshFeaturesLayers(featuresLayers));
  });

  recenterMap(flMap, featuresLayers);

  return featuresLayers;
}

export function recenterMap(
  flMap: LeafLetMap,
  featuresLayers: FeaturesLayouts,
): void {
  const allowedFeaturs = featuresLayers
    .filter(([, layer]) => flMap.hasLayer(layer))
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
      [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
    ], // [[minLat, minLng], [maxLat, maxLng]]
  );

  flMap.flyToBounds(
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

export function updateFeaturesLayers(
  flMap: LeafLetMap,
  datas: { [name: string]: FeatureCollection<Point> },
) {
  const oldFeaturesLayers = featuresLayoutsMap.get(flMap);

  if (oldFeaturesLayers) {
    oldFeaturesLayers.forEach(([, layout]) => {
      flMap.removeLayer(layout);
    });
  } else {
    adjustZoomScale(flMap);

    flMap.on('zoomend', () => {
      //console.debug(flMap.getZoom());
      adjustZoomScale(flMap);

      const featuresLayers = featuresLayoutsMap.get(flMap);

      if (featuresLayers) {
        refreshFeaturesLayers(featuresLayers);
      }
    });
  }

  const newFeaturesLayers = createFeaturesLayers(flMap, datas);

  featuresLayoutsMap.set(flMap, newFeaturesLayers);

  return newFeaturesLayers;
}
