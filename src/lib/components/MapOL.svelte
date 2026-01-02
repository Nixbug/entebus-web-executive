<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import XYZ from 'ol/source/XYZ';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Draw from 'ol/interaction/Draw';
	import Modify from 'ol/interaction/Modify';
	import Snap from 'ol/interaction/Snap';
	import GeoJSON from 'ol/format/GeoJSON';
	import WKT from 'ol/format/WKT';
	import Feature from 'ol/Feature';
	import { getCenter } from 'ol/extent';
	import Style from 'ol/style/Style';
	import Stroke from 'ol/style/Stroke';
	import Fill from 'ol/style/Fill';
	import CircleStyle from 'ol/style/Circle';
	import CircleGeom from 'ol/geom/Circle';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import 'ol/ol.css';

	export let center = { lat: 15.8505, lng: 71.162711 };
	export let zoom = 7;
	export let tileType: 'standard' | 'google' = 'standard';
	export let googleTileUrl = '';
	export let standardTileUrl = 'OSM_DEFAULT';
	export let boundary: any = null;
	console.log('boundary in MapOL:', boundary);
	let container: HTMLDivElement;
	let map: Map;
	let tileLayer: TileLayer<any>;
	let vectorSource: any;
	let vectorLayer: VectorLayer<any>;
	let drawInteraction: Draw | null = null;
	let modifyInteraction: Modify | null = null;
	let snapInteraction: Snap | null = null;
	const geojsonFormat = new GeoJSON();
	const dispatch = createEventDispatcher();
	let _pointerMoveHandler: any = null;
	let _drawEndHandler: any = null;
	let _drawStartHandler: any = null;
	let _geomChangeHandler: any = null;

	export function flyTo(lat: number, lng: number, z = 14) {
		map?.getView().animate({
			center: fromLonLat([lng, lat]),
			zoom: z,
			duration: 500
		});
	}

	export function updateSize() {
		map?.updateSize();
	}

	function createVectorLayer() {
		vectorSource = new VectorSource({ wrapX: false });
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: (feature, resolution) => {
				const geom = feature.getGeometry();
				// If feature is a circle drawn for rectangle, show only the visual circle (hide rectangle)
				if (geom?.getType() === 'Circle' && feature.get('isCircleForRectangle')) {
					const extent = geom.getExtent();
					const dx = extent[2] - extent[0];
					const dy = extent[3] - extent[1];
					let center;
					if (geom instanceof CircleGeom) {
						center = geom.getCenter();
					} else {
						center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
					}
					// Prefer the geometry's own radius when available (true circle); otherwise use half
					// of the smaller side so the visual circle fits within the rectangle.
					const radius =
						geom instanceof CircleGeom && typeof geom.getRadius === 'function'
							? geom.getRadius()
							: Math.min(dx, dy) / 2;
					// Rectangle coordinates
					const rectCoords = [
						[extent[0], extent[1]],
						[extent[2], extent[1]],
						[extent[2], extent[3]],
						[extent[0], extent[3]],
						[extent[0], extent[1]]
					];
					// Style for circle only (do not render the backend rectangle to the user)
					const circleStyle = new Style({
						stroke: new Stroke({ color: 'rgba(0,123,255,0.9)', width: 2 }),
						fill: new Fill({ color: 'rgba(0,123,255,0.2)' }),
						geometry: new CircleGeom(center, radius)
					});
					return circleStyle;
				}
				// Default style
				return new Style({
					stroke: new Stroke({ color: 'rgba(0,123,255,0.9)', width: 2 }),
					fill: new Fill({ color: 'rgba(0,123,255,0.2)' }),
					image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#007bff' }) })
				});
			}
		});
	}

	export function startDrawing(type: 'Point' | 'LineString' | 'Polygon' | 'Rectangle') {
		if (!map || !vectorSource) return;
		stopDrawing();
		if (type === 'Rectangle') {
			// Use Circle draw for user experience
			drawInteraction = new Draw({ source: vectorSource, type: 'Circle' });
		} else {
			drawInteraction = new Draw({ source: vectorSource, type });
		}
		map.addInteraction(drawInteraction);

		// live area updates: on drawstart attach geometry change listener
		_drawStartHandler = (evt: any) => {
			const feature = evt.feature;
			// Mark circle features for rectangle conversion and dual styling
			if (type === 'Rectangle') {
				feature.set('isCircleForRectangle', true);
			}
			_geomChangeHandler = () => {
				try {
					const geom: any = feature.getGeometry();
					let area = 0;
					if (type === 'Rectangle' && geom.getType() === 'Circle') {
						// Calculate rectangle area from circle extent
						const extent = geom.getExtent();
						const dx = extent[2] - extent[0];
						const dy = extent[3] - extent[1];
						area = dx * dy;
					} else {
						area = geom.getArea ? geom.getArea() : 0;
					}
					dispatch('drawArea', { area });
				} catch (e) {
					// ignore
				}
			};
			try {
				feature.getGeometry().on('change', _geomChangeHandler);
			} catch (e) {
				// ignore
			}
		};
		drawInteraction.on('drawstart', _drawStartHandler);

		// Hide default sketch style for rectangle drawing
		if (type === 'Rectangle' && drawInteraction) {
			drawInteraction.set('style', (feature: any) => {
				const geom = feature.getGeometry();
				if (geom.getType() === 'Polygon') {
					const extent = geom.getExtent();
					const dx = extent[2] - extent[0];
					const dy = extent[3] - extent[1];
					const center =
						typeof geom.getCenter === 'function'
							? geom.getCenter()
							: [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
					const radius = Math.min(dx, dy) / 2;
					return new Style({
						stroke: new Stroke({ color: 'rgba(0,123,255,0.9)', width: 2 }),
						fill: new Fill({ color: 'rgba(0,123,255,0.2)' }),
						geometry: new CircleGeom(center, radius)
					});
				}
				return null;
			});
		}

		// on drawend dispatch final area and cleanup geom change listener
		_drawEndHandler = (evt: any) => {
			try {
				const feature = evt.feature;
				const geom: any = feature.getGeometry();
				let area = 0;
				let boundaryWkt: string | null = null;
				if (type === 'Rectangle') {
					// If polygon (createBox) or circle, compute rectangle extent for backend
					const extent = geom.getExtent();
					if (extent) {
						const dx = extent[2] - extent[0];
						const dy = extent[3] - extent[1];
						area = dx * dy;
						const rectCoords = [
							[extent[0], extent[1]],
							[extent[2], extent[1]],
							[extent[2], extent[3]],
							[extent[0], extent[3]],
							[extent[0], extent[1]]
						];
						const lonlatCoords = rectCoords.map((c: any) => {
							const ll = toLonLat(c);
							return `${ll[0]} ${ll[1]}`;
						});
						boundaryWkt = `POLYGON((${lonlatCoords.join(',')}))`;
						boundary = boundaryWkt;
						// Replace feature geometry with a visual circle so rectangle is not visible
						const center =
							typeof geom.getCenter === 'function'
								? geom.getCenter()
								: [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
						const radius =
							typeof geom.getRadius === 'function' ? geom.getRadius() : Math.min(dx, dy) / 2;
						feature.setGeometry(new CircleGeom(center, radius));
						// store backend rectangle coords on feature (not rendered)
						feature.set('backendRectCoords', rectCoords);
					}
				} else if (geom && geom.getType && geom.getType() === 'Polygon') {
					area = geom.getArea ? geom.getArea() : 0;
					const coords = geom.getCoordinates()[0] || [];
					const lonlatCoords = coords.map((c: any) => {
						const ll = toLonLat(c);
						return `${ll[0]} ${ll[1]}`;
					});
					if (
						lonlatCoords.length > 0 &&
						lonlatCoords[0] !== lonlatCoords[lonlatCoords.length - 1]
					) {
						lonlatCoords.push(lonlatCoords[0]);
					}
					boundaryWkt = `POLYGON((${lonlatCoords.join(',')}))`;
					boundary = boundaryWkt;
				}
				dispatch('drawComplete', { area, boundary: boundaryWkt });
			} catch (e) {
				// ignore
			}
			if (_geomChangeHandler) {
				try {
					evt.feature.getGeometry().un('change', _geomChangeHandler);
				} catch (e) {}
				_geomChangeHandler = null;
			}
		};
		drawInteraction.on('drawend', _drawEndHandler);
	}

	export function stopDrawing() {
		if (!map) return;
		if (drawInteraction) {
			if (_drawEndHandler) {
				drawInteraction.un('drawend', _drawEndHandler);
				_drawEndHandler = null;
			}
			if (_drawStartHandler) {
				drawInteraction.un('drawstart', _drawStartHandler);
				_drawStartHandler = null;
			}
			map.removeInteraction(drawInteraction);
			drawInteraction = null;
		}
	}

	export function clearDrawings() {
		vectorSource?.clear();
		dispatch('drawCleared');
	}

	export function getDrawnGeoJSON() {
		return geojsonFormat.writeFeaturesObject(vectorSource.getFeatures());
	}

	function createSource() {
		if (tileType === 'google') {
			if (!googleTileUrl) return new OSM();

			return new XYZ({
				url: googleTileUrl,
				crossOrigin: 'anonymous',
				maxZoom: 22
			});
		}

		if (tileType === 'standard') {
			if (standardTileUrl && standardTileUrl !== 'OSM_DEFAULT') {
				return new XYZ({
					url: standardTileUrl,
					crossOrigin: 'anonymous',
					maxZoom: 19
				});
			}
			return new OSM();
		}

		return new OSM();
	}

	function updateTileLayer() {
		if (!map || !tileLayer) return;

		const source = createSource();
		if (!source) return;

		tileLayer.setSource(source);
		tileLayer.changed();
		map.renderSync();
	}

	onMount(() => {
		createVectorLayer();

		tileLayer = new TileLayer({
			source: createSource() ?? new OSM()
		});

		map = new Map({
			target: container,
			layers: [tileLayer, vectorLayer],
			view: new View({
				center: fromLonLat([center.lng, center.lat]),
				zoom
			}),
			controls: []
		});

		// pointer move -> dispatch lon/lat
		_pointerMoveHandler = (evt: any) => {
			if (!evt || !evt.coordinate) return;
			try {
				const ll = toLonLat(evt.coordinate);
				dispatch('mapPointerMove', { lon: ll[0], lat: ll[1] });
			} catch (e) {
				// ignore
			}
		};
		map.on('pointermove', _pointerMoveHandler);
	});

	// If an external WKT `boundary` prop is provided, parse and render it on the map.
	// This reactive block clears existing display features and adds the parsed feature,
	// then fits the view to the geometry extent.
	$: if (map && vectorSource) {
		// keep any drawn features cleared when user requests to view a specific boundary
		vectorSource.clear();
		if (boundary) {
			try {
				const wkt = new WKT();
				const feat = wkt.readFeature(boundary, {
					dataProjection: 'EPSG:4326',
					featureProjection: 'EPSG:3857'
				});
				if (feat && feat.getGeometry) {
					const geom: any = feat.getGeometry();
					// If polygon (likely a rectangle stored as WKT), show a visual circle instead
					if (geom?.getType && geom.getType() === 'Polygon') {
						const extent = geom.getExtent();
						if (extent) {
							const dx = extent[2] - extent[0];
							const dy = extent[3] - extent[1];
							const center = getCenter(extent);
							const radius = Math.min(dx, dy) / 2;
							// create a circle feature for display and keep backend rectangle coords
							const circleFeat = new Feature(new CircleGeom(center, radius));
							circleFeat.set('isCircleForRectangle', true);
							circleFeat.set('backendRectCoords', geom.getCoordinates()[0] || []);
							vectorSource.addFeature(circleFeat);
							if (map && map.getView) {
								map.getView().fit(extent, { padding: [20, 20, 20, 20], duration: 300 });
							}
						}
					} else {
						// non-polygon geometries: add as-is
						vectorSource.addFeature(feat);
						const extent = geom?.getExtent();
						if (extent && map && map.getView) {
							map.getView().fit(extent, { padding: [20, 20, 20, 20], duration: 300 });
						}
					}
				}
			} catch (err) {
				console.error('Failed to parse boundary WKT:', err);
			}
		}
	}

	$: {
		const type = tileType;
		const googleUrl = googleTileUrl;
		const standardUrl = standardTileUrl;

		if (map && tileLayer) {
			updateTileLayer();
		}
	}

	onDestroy(() => {
		stopDrawing();
		if (map && _pointerMoveHandler) {
			map.un('pointermove', _pointerMoveHandler);
			_pointerMoveHandler = null;
		}
		map?.setTarget(undefined);
	});
</script>

<div bind:this={container} style="width:100%; height:100%;"></div>
