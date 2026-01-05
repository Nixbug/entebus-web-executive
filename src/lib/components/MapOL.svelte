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
	export let landmarks: any[] = [];
	export let selectedLandmarkId: string | null = null;

	let container: HTMLDivElement;
	let map: Map;
	let tileLayer: TileLayer<any>;
	let vectorSource: any;
	let vectorLayer: VectorLayer<any>;
	let landmarksSource: any;
	let landmarksLayer: VectorLayer<any>;
	let drawInteraction: Draw | null = null;
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

	function createLandmarkLayer() {
		landmarksSource = new VectorSource({ wrapX: false });
		landmarksLayer = new VectorLayer({
			source: landmarksSource,
			style: (feature, resolution) => {
				const isSelected = !!feature.get('isSelected');
				const geom = feature.getGeometry();
				if (isSelected) {
					return new Style({
						stroke: new Stroke({ color: 'rgba(255,99,71,0.95)', width: 3 }),
						fill: new Fill({ color: 'rgba(255,99,71,0.15)' }),
						image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ff6347' }) })
					});
				}
				// default landmark style
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
		// stop any current draw interaction
		stopDrawing();
		// debug: counts before clearing
		try {
			console.debug && console.debug('startDrawing - before clear', {
				vectorCount: vectorSource && typeof vectorSource.getFeatures === 'function' ? vectorSource.getFeatures().length : null,
				landmarksCount: landmarksSource && typeof landmarksSource.getFeatures === 'function' ? landmarksSource.getFeatures().length : null
			});
		} catch (e) {}
		// clear any previously drawn feature so only one drawn circle is visible
		try {
			// remove from vector source (all user drawings)
			if (vectorSource && typeof vectorSource.getFeatures === 'function') {
				const vfeats = vectorSource.getFeatures();
				for (const f of vfeats) {
					try {
						if (f.get && (f.get('drawnByUser') || f.get('isCircleForRectangle'))) {
							vectorSource.removeFeature(f);
						}
					} catch (e) {}
				}
			} else {
				vectorSource.clear && vectorSource.clear();
			}

			// also remove any previously user-drawn or temporary circle features from landmarksSource
			if (landmarksSource && typeof landmarksSource.getFeatures === 'function') {
				// build set of known landmark ids to avoid removing persisted landmarks
				const knownIds = new Set((landmarks || []).map((l: any) => l?.id || l?._id).filter(Boolean));
				const feats = landmarksSource.getFeatures();
				for (const f of feats) {
					try {
						const isTemp =
							!!(
								(f.get && f.get('drawnByUser')) ||
								(f.get && f.get('isCircleForRectangle') && !knownIds.has(f.get('landmarkId')))
							);
						if (isTemp) {
							landmarksSource.removeFeature(f);
						}
					} catch (e) {}
				}
			}
			dispatch('drawCleared');

			// debug: counts after clearing
			try {
				console.debug && console.debug('startDrawing - after clear', {
					vectorCount: vectorSource && typeof vectorSource.getFeatures === 'function' ? vectorSource.getFeatures().length : null,
					landmarksCount: landmarksSource && typeof landmarksSource.getFeatures === 'function' ? landmarksSource.getFeatures().length : null
				});
			} catch (e) {}
		} catch (e) {
			// ignore
		}
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
				// mark this feature as drawn by the user so we can clear it later
				feature.set('drawnByUser', true);
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

				// Mark this feature as drawnByUser and remove other previous user-drawn features.
				try {
					if (evt && evt.feature) {
						evt.feature.set && evt.feature.set('drawnByUser', true);
						// remove other user-drawn features in vectorSource
						if (vectorSource && typeof vectorSource.getFeatures === 'function') {
							const all = vectorSource.getFeatures();
							for (const f of all) {
								if (f !== evt.feature) {
									try {
										if (f.get && (f.get('drawnByUser') || f.get('isCircleForRectangle'))) {
											vectorSource.removeFeature(f);
										}
									} catch (e) {}
								}
							}
						}
						// also remove temporary ones from landmarksSource
						if (landmarksSource && typeof landmarksSource.getFeatures === 'function') {
							const known = new Set((landmarks || []).map((l: any) => l?.id || l?._id).filter(Boolean));
							const lfs = landmarksSource.getFeatures();
							for (const lf of lfs) {
								try {
									if (lf.get && (lf.get('drawnByUser') || (lf.get('isCircleForRectangle') && !known.has(lf.get('landmarkId'))))) {
										landmarksSource.removeFeature(lf);
									}
								} catch (e) {}
							}
						}
					}
				} catch (e) {}
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
		createLandmarkLayer();

		tileLayer = new TileLayer({
			source: createSource() ?? new OSM()
		});

		map = new Map({
			target: container,
			layers: [tileLayer, landmarksLayer, vectorLayer],
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

// Render landmarks list (read-only) and highlight selected landmark.
$: if (map && landmarksSource) {
	try {
		landmarksSource.clear();
		if (landmarks && Array.isArray(landmarks) && landmarks.length > 0) {
			const wkt = new WKT();
			const extents: any[] = [];
			let selectedFeature: any = null;

			for (const lm of landmarks) {
				if (!lm || !lm.boundary) continue;
				try {
					const feat = wkt.readFeature(lm.boundary, {
						dataProjection: 'EPSG:4326',
						featureProjection: 'EPSG:3857'
					});
					if (!feat) continue;

					const geom: any = feat.getGeometry();

					// If polygon (likely a rectangle stored as WKT), show a visual circle instead
					if (geom && geom.getType && geom.getType() === 'Polygon') {
						const extent = geom.getExtent();
						if (extent) {
							const dx = extent[2] - extent[0];
							const dy = extent[3] - extent[1];
							const center = getCenter(extent);
							const radius = Math.min(dx, dy) / 2;
							const circleFeat = new Feature(new CircleGeom(center, radius));
							// mark as visual circle for a backend rectangle
							circleFeat.set('isCircleForRectangle', true);
							// store backend rectangle coords (in map projection)
							circleFeat.set('backendRectCoords', geom.getCoordinates()[0] || []);
							circleFeat.set('landmarkId', lm.id || lm._id || null);
							circleFeat.set('landmarkName', lm.name || '');
							const isSel = selectedLandmarkId && lm.id === selectedLandmarkId;
							circleFeat.set('isSelected', !!isSel);
							landmarksSource.addFeature(circleFeat);
							if (extent) extents.push(extent);
							if (isSel) selectedFeature = circleFeat;
						}
					} else {
						// non-polygon geometries: add as-is
						feat.set('landmarkId', lm.id || lm._id || null);
						feat.set('landmarkName', lm.name || '');
						const isSel = selectedLandmarkId && lm.id === selectedLandmarkId;
						feat.set('isSelected', !!isSel);
						landmarksSource.addFeature(feat);
						const extent = geom && geom.getExtent ? geom.getExtent() : null;
						if (extent) extents.push(extent);
						if (isSel) selectedFeature = feat;
					}
					} catch (e) {
						// ignore individual parse errors
					}
				}

				// If a specific landmark is selected, focus it and ensure it's highlighted.
				if (selectedFeature) {
					try {
						const geom: any = selectedFeature.getGeometry();
						const extent = geom && geom.getExtent ? geom.getExtent() : null;
						if (extent && map && map.getView) {
							map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 300 });
						} else if (geom && geom.getType && geom.getType() === 'Point') {
							const coord = geom.getCoordinates();
							const ll = toLonLat(coord);
							map.getView().animate({ center: fromLonLat([ll[0], ll[1]]), zoom: 14, duration: 300 });
						}
					} catch (e) {
						// ignore fit errors
					}
				} else if (extents.length > 0) {
					// Fit to all landmarks so the map shows them initially
					try {
						// combine extents
						let combined = extents[0].slice();
						for (let i = 1; i < extents.length; i++) {
							combined[0] = Math.min(combined[0], extents[i][0]);
							combined[1] = Math.min(combined[1], extents[i][1]);
							combined[2] = Math.max(combined[2], extents[i][2]);
							combined[3] = Math.max(combined[3], extents[i][3]);
						}
						if (map && map.getView) {
							map.getView().fit(combined, { padding: [40, 40, 40, 40], duration: 300 });
						}
					} catch (e) {
						// ignore
					}
				}
			}
		} catch (err) {
			console.error('Error rendering landmarks:', err);
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
