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
	import Text from 'ol/style/Text';
	import CircleStyle from 'ol/style/Circle';
	import CircleGeom from 'ol/geom/Circle';
	import Point from 'ol/geom/Point';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import {
		GeometryUtils,
		ValidationUtils,
		StyleUtils,
		FeatureUtils,
		InteractionUtils
	} from '../utils/openlayers.utils';

	//-- Props --
	export let center = { lat: 15.8505, lng: 71.162711 };
	export let zoom = 7;
	export let tileType: 'standard' | 'google' = 'standard';
	export let googleTileUrl = '';
	export let standardTileUrl = 'OSM_DEFAULT';
	export let boundary: any = null;
	export let landmarks: any[] = [];
	export let selectedLandmarkId: string | null = null;

	//-- Variables --
	let container: HTMLDivElement;
	let map: Map;
	let tileLayer: TileLayer<any>;
	let vectorSource: any;
	let vectorLayer: VectorLayer<any>;
	let landmarksSource: any;
	let landmarksLayer: VectorLayer<any>;
	let drawInteraction: Draw | null = null;
	let modifyInteraction: Modify | null = null;
	let snapInteraction: Snap | null = null;
	const geojsonFormat = new GeoJSON();
	const dispatch = createEventDispatcher();
	let _pointerMoveHandler: any = null;
	let _drawEndHandler: any = null;
	let _drawStartHandler: any = null;
	let _geomChangeHandler: any = null;
	let _dragPanInteraction: any = null;
	let _currentDrawingType: 'Point' | 'LineString' | 'Polygon' | 'Rectangle' | null = null;
	let _isDrawingActive = false;
	let _isModifyEnabled = false;

	//-- Centralized error handler: logs and emits a `mapError` event --
	function handleError(err: any, context?: string) {
		try {
			console.error('[MapOL]' + (context ? ' ' + context : ''), err);
			dispatch('mapError', {
				message: err && err.message ? err.message : String(err),
				context: context || null,
				error: err
			});
		} catch (e) {
			//-- swallow to avoid secondary errors while handling the original one --
			console.error('[MapOL] error while handling another error', e);
		}
	}

	//-- Utility to detect touch devices --
	const isTouchDevice = () =>
		typeof window !== 'undefined' &&
		('ontouchstart' in window || (navigator && (navigator as any).maxTouchPoints > 0));

	//-- Utility to update map size --
	export function updateSize() {
		map?.updateSize();
	}

	//-- Create vector layer for user drawings --
	function createVectorLayer() {
		vectorSource = new VectorSource({ wrapX: false });
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: (feature) => {
				const geom = feature.getGeometry();
				//-- If feature is a circle for rectangle, show only the circle enclosing the rectangle --
				if (geom?.getType() === 'Circle' && feature.get('isCircleForRectangle')) {
					let center, radius;
					if (geom instanceof CircleGeom) {
						center = geom.getCenter();
						radius = geom.getRadius();
					} else {
						//-- fallback to default values if not a CircleGeom --
						center = [0, 0];
						radius = 0;
					}
					//-- Style for the enclosing circle --
					const circleStyle = new Style({
						stroke: new Stroke({ color: 'rgba(16,185,129,0.95)', width: 2 }),
						fill: new Fill({ color: 'rgba(16,185,129,0.15)' }),
						geometry: new CircleGeom(center, radius)
					});
					return circleStyle;
				}
				//-- Default style for other geometries --
				return StyleUtils.createDrawingStyle();
			}
		});
	}

	//-- Create vector layer containing landmarks/boundaries --
	function createLandmarkLayer() {
		landmarksSource = new VectorSource({ wrapX: false });
		landmarksLayer = new VectorLayer({
			source: landmarksSource,
			style: (feature) => {
				const isSelected = !!feature.get('isSelected');
				if (isSelected) {
					//-- Green theme for selected landmark --
					return StyleUtils.createSelectedStyle();
				}
				//-- Default landmark style --
				const baseStyle = StyleUtils.createStyle('default');
				//-- Add a text label above the feature if a name is available --
				const label = feature.get('landmarkName') || '';
				if (label) {
					let labelGeom: any = null;
					try {
						const geom = feature.getGeometry();
						if (geom && geom.getType && geom.getType() === 'Point') {
							labelGeom = geom;
						} else if (geom && geom.getType && geom.getType() === 'Circle') {
							let center;
							if (geom instanceof CircleGeom || (geom.getType && geom.getType() === 'Circle')) {
								center = (geom as CircleGeom).getCenter();
							} else if (geom.getExtent) {
								center = getCenter(geom.getExtent());
							} else {
								center = [0, 0];
							}
							labelGeom = new Point(center);
						} else if (geom && geom.getExtent) {
							const extent = geom.getExtent();
							const c = getCenter(extent);
							labelGeom = new Point(c);
						}
					} catch (e) {
						handleError(e, 'calculating label geometry');
						labelGeom = null;
					}
					if (labelGeom) {
						const labelStyle = new Style({
							geometry: labelGeom,
							text: new Text({
								text: label,
								font: '600 12px Inter, Arial, sans-serif',
								fill: new Fill({ color: 'rgba(3,37,99,1)' }),
								stroke: new Stroke({ color: 'rgba(255,255,255,0.95)', width: 3 }),
								offsetY: -18,
								overflow: true
							})
						});
						return [baseStyle, labelStyle];
					}
				}
				return baseStyle;
			}
		});
	}

	//-- Clear previous user drawings --
	function clearPreviousDrawings() {
		//-- Clear vector source (all user drawings) --
		if (vectorSource && typeof vectorSource.clear === 'function') {
			vectorSource.clear();
		}
		//-- Also remove temporary ones from landmarksSource --
		if (landmarksSource && typeof landmarksSource.getFeatures === 'function') {
			const known = new Set((landmarks || []).map((l: any) => l?.id || l?._id).filter(Boolean));
			const lfs = landmarksSource.getFeatures();
			for (const lf of lfs) {
				try {
					if (
						lf.get &&
						(lf.get('drawnByUser') ||
							(lf.get('isCircleForRectangle') && !known.has(lf.get('landmarkId'))))
					) {
						FeatureUtils.removeFeatureFromSource(lf, landmarksSource);
					}
				} catch (e: any) {
					handleError(e, 'clearing previous drawings');
				}
			}
		}
		dispatch('drawCleared');
	}

	//-- Enable modify interaction for resizing circles --
	function enableModify() {
		if (!map || !vectorSource) return;
		//-- Remove existing interactions first --
		disableModify();

		const wktFormat = new WKT();

		//-- Create modify interaction for circle resizing --
		modifyInteraction = new Modify({
			source: vectorSource,
			//-- Only allow modifying circle features representing rectangles --
			condition: (event) => {
				if (!event || !event.pixel) return false;
				const features = map.getFeaturesAtPixel(event.pixel, {
					layerFilter: (layer) => layer === vectorLayer || layer === landmarksLayer
				});
				if (features.length > 0) {
					const feature = features[0];
					//-- Only allow modification of circle-for-rectangle features --
					return feature.get('isCircleForRectangle') === true;
				}
				return false;
			},
			//-- This makes the boundary "attractive" to cursor --
			pixelTolerance: 15,
			//-- Style for the modify interaction (vertices) --
			style: new Style({
				image: new CircleStyle({
					radius: 6,
					fill: new Fill({ color: '#ff0000' }),
					stroke: new Stroke({ color: '#ffffff', width: 2 })
				})
			})
		});

		//-- When circle is modified, update the backend rectangle --
		modifyInteraction.on('modifyend', (event) => {
			event.features.forEach((feature) => {
				//-- Clean up geometry change handler --
				FeatureUtils.cleanupGeometryHandler(feature);

				//-- Finalize modification --
				const ok = FeatureUtils.updateBackendRectangle(feature, landmarks, wktFormat, dispatch);

				//-- Update style based on validity --
				if (!ok) {
					FeatureUtils.setFeatureProperties(feature, { isInvalid: true });
					feature.setStyle?.(StyleUtils.createInvalidStyle());
				} else {
					FeatureUtils.setFeatureProperties(feature, { isInvalid: false });
					feature.setStyle?.(undefined);
				}
			});
		});

		//-- When modification starts, save pre-modify geometry and attach live validation listener --
		modifyInteraction.on('modifystart', (event) => {
			event.features.forEach((feature) => {
				try {
					const geom = feature.getGeometry && feature.getGeometry();
					//-- store a clone of existing geometry so we can revert if needed --
					try {
						feature.set(
							'preModifyGeom',
							geom && typeof geom.clone === 'function' ? geom.clone() : geom
						);
					} catch (e: any) {
						handleError(e, 'cloning geometry before modify');
					}

					//-- Create and attach live change handler --
					const modHandler = InteractionUtils.createModifyChangeHandler(
						feature,
						landmarks,
						_currentDrawingType || 'Rectangle',
						dispatch,
						wktFormat
					);

					//-- attach handler to geometry change --
					try {
						const g2 = feature.getGeometry && feature.getGeometry();
						if (g2 && g2.on && typeof modHandler === 'function') {
							g2.on('change', modHandler);
							feature.set && feature.set('modifyChangeHandler', modHandler);
						}
					} catch (e: any) {
						handleError(e, 'attaching modify change handler');
					}
				} catch (e: any) {
					handleError(e, 'modify start handler');
				}
			});
		});

		//-- Add snap interaction to help cursor stick to circle boundary--
		snapInteraction = new Snap({
			source: vectorSource,
			pixelTolerance: 10
		});

		map.addInteraction(modifyInteraction);
		map.addInteraction(snapInteraction);
		_isModifyEnabled = true;
	}

	//-- Disable modify interaction --
	function disableModify() {
		if (!map) return;
		if (modifyInteraction) {
			map.removeInteraction(modifyInteraction);
			modifyInteraction = null;
		}
		if (snapInteraction) {
			map.removeInteraction(snapInteraction);
			snapInteraction = null;
		}
		_isModifyEnabled = false;
	}

	//-- Start drawing --
	export function startDrawing(
		type: 'Point' | 'LineString' | 'Polygon' | 'Rectangle',
		opts: { keepExisting?: boolean } = {}
	) {
		if (!map || !vectorSource) return;

		_currentDrawingType = type;
		_isDrawingActive = true;

		//-- stop any current draw interaction --
		stopDrawing();
		const keepExisting = !!opts.keepExisting;
		//-- choose draw options; on touch prefer freehand for easier drawing --
		const touch = isTouchDevice();
		//-- style used while drawing (valid) — use green theme to match modify visuals --
		const drawingStyle = StyleUtils.createDrawingStyle();
		const drawOpts: any = {
			source: vectorSource,
			type: type === 'Rectangle' ? 'Circle' : type,
			style: drawingStyle
		};
		if (touch) {
			//-- freehand allows single-finger drawing on mobile --
			drawOpts.freehand = true;
			//-- accept touch input without modifier keys --
			drawOpts.condition = () => true;
		}
		drawInteraction = new Draw(drawOpts);
		map.addInteraction(drawInteraction);

		const wktFormat = new WKT();

		//-- live area updates: on drawstart attach geometry change listener --
		_drawStartHandler = (evt: any) => {
			//-- CLEAR PREVIOUS DRAWINGS AS SOON AS USER STARTS DRAWING (first click) --
			//-- Skip clearing when caller requested to keep existing visuals (sidebar edit UX) --
			if (!keepExisting) {
				clearPreviousDrawings();
			}

			const feature = evt.feature;
			//-- Mark circle features for rectangle conversion --
			if (type === 'Rectangle') {
				FeatureUtils.setFeatureProperties(feature, {
					isCircleForRectangle: true,
					drawnByUser: true
				});
			}

			//-- Setup geometry change handler --
			_geomChangeHandler = InteractionUtils.setupGeometryChangeHandler(
				feature,
				type,
				landmarks,
				dispatch,
				wktFormat
			);
		};
		drawInteraction.on('drawstart', _drawStartHandler);

		//-- on drawend dispatch final area and cleanup geom change handler --
		_drawEndHandler = (evt: any) => {
			try {
				const feature = evt.feature;
				const geom: any = feature.getGeometry();
				let area = 0;
				let boundaryWkt: string | null = null;

				if (type === 'Rectangle') {
					//-- Get rectangle info from circle --
					const rectInfo = GeometryUtils.circleToRectangle(geom);
					area = rectInfo.area;
					boundaryWkt = GeometryUtils.rectCoordsToWKT(rectInfo.rectCoords);

					//-- Store backend rectangle coords on feature (not rendered) --
					FeatureUtils.setFeatureProperties(feature, {
						backendRectCoords: rectInfo.rectCoords,
						circleRadius: rectInfo.radius,
						circleCenter: rectInfo.center
					});
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
				}

				//-- Validate the drawing --
				const validation = ValidationUtils.validateDrawing(geom, type, landmarks, null, wktFormat);

				if (!validation.isValid) {
					//-- Report validation message --
					if (validation.message) {
						handleError(new Error(validation.message), 'drawing validation');
					}

					//-- Clean up geometry handler --
					if (_geomChangeHandler && feature && feature.getGeometry) {
						try {
							feature.getGeometry().un && feature.getGeometry().un('change', _geomChangeHandler);
						} catch (e: any) {
							handleError(e, 'cleaning up geometry handler');
						}
						_geomChangeHandler = null;
					}

					//-- Mark as invalid --
					FeatureUtils.setFeatureProperties(feature, {
						drawnByUser: true,
						isInvalid: true
					});

					//-- Set invalid style --
					feature.setStyle?.(StyleUtils.createInvalidStyle());

					boundary = null;
					dispatch('drawError', { message: validation.message });

					//-- enable modify so user can adjust this invalid boundary --
					setTimeout(() => {
						try {
							enableModify();
						} catch (e: any) {
							handleError(e, 'enabling modify after invalid draw');
						}
					}, 0);
					return;
				}

				//-- boundary is valid — reflect it in internal state before notifying parent --
				try {
					boundary = boundaryWkt;
				} catch (e: any) {
					handleError(e, 'setting boundary WKT');
				}
				dispatch('drawComplete', { area, boundary: boundaryWkt });

				//-- Mark this feature as drawnByUser --
				FeatureUtils.setFeatureProperties(feature, { drawnByUser: true });

				//-- Enable modify interaction for resizing after drawing is complete --
				if (type === 'Rectangle') {
					setTimeout(() => {
						enableModify();
					}, 100);
				}
			} catch (e: any) {
				handleError(e, 'finalizing drawing');
			}

			//-- Clean up geometry handler --
			if (_geomChangeHandler) {
				try {
					evt.feature.getGeometry().un('change', _geomChangeHandler);
				} catch (e: any) {
					handleError(e, 'cleaning up geometry handler');
				}
				_geomChangeHandler = null;
			}
		};
		drawInteraction.on('drawend', _drawEndHandler);
	}

	//-- Stop drawing (unchanged) --
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
		_isDrawingActive = false;
		//-- restore DragPan when drawing stops --
		try {
			if (_dragPanInteraction && typeof _dragPanInteraction.setActive === 'function') {
				_dragPanInteraction.setActive(true);
			}
			_dragPanInteraction = null;
		} catch (e: any) {
			handleError(e, 'restoring DragPan interaction');
		}
	}

	//-- Clear all drawings (unchanged) --
	export function clearDrawings() {
		clearPreviousDrawings();
		_isDrawingActive = false;
		disableModify();
	}

	//-- Expose modify functions for external control (unchanged) --
	export function startModify() {
		enableModify();
	}

	export function stopModify() {
		disableModify();
	}

	export function toggleModify() {
		if (_isModifyEnabled) {
			disableModify();
		} else {
			enableModify();
		}
	}

	//-- Get drawn features as GeoJSON (unchanged) --
	export function getDrawnGeoJSON() {
		return geojsonFormat.writeFeaturesObject(vectorSource.getFeatures());
	}

	//-- Create tile source based on selected tile type and URLs (unchanged) --
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

	//-- Update tile layer when tile type or URLs change (unchanged) --
	function updateTileLayer() {
		if (!map || !tileLayer) return;

		const source = createSource();
		if (!source) return;

		tileLayer.setSource(source);
		tileLayer.changed();
		map.renderSync();
	}

	//-- Initialize map on mount (unchanged) --
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

		//-- pointer move -> dispatch lon/lat --
		_pointerMoveHandler = (evt: any) => {
			if (!evt || !evt.coordinate) return;
			try {
				const ll = toLonLat(evt.coordinate);
				dispatch('mapPointerMove', { lon: ll[0], lat: ll[1] });
			} catch (e: any) {
				handleError(e, 'pointer move handler');
			}
		};
		map.on('pointermove', _pointerMoveHandler);
	});

	//-- Render landmarks list (read-only) and highlight selected landmark --
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

						//-- If polygon (rectangle stored as WKT), calculate the enclosing circle --
						if (geom && geom.getType && geom.getType() === 'Polygon') {
							const extent = geom.getExtent();
							if (extent) {
								const center = getCenter(extent);
								const dx = extent[2] - extent[0];
								const dy = extent[3] - extent[1];
								//-- Calculate the circle that encloses the rectangle --
								//-- The circle's diameter should be the diagonal of the rectangle --
								const diagonal = Math.sqrt(dx * dx + dy * dy);
								const radius = diagonal / 2;

								const circleFeat = new Feature(new CircleGeom(center, radius));
								//-- mark as visual circle for a backend rectangle --
								FeatureUtils.setFeatureProperties(circleFeat, {
									isCircleForRectangle: true,
									backendRectCoords: geom.getCoordinates()[0] || [],
									landmarkId: lm.id || lm._id || null,
									landmarkName: lm.name || '',
									isSelected: !!(selectedLandmarkId && lm.id === selectedLandmarkId)
								});

								landmarksSource.addFeature(circleFeat);
								if (extent) extents.push(extent);
								if (selectedLandmarkId && lm.id === selectedLandmarkId)
									selectedFeature = circleFeat;
							}
						} else {
							//-- regular feature (e.g., point) --
							FeatureUtils.setFeatureProperties(feat, {
								landmarkId: lm.id || lm._id || null,
								landmarkName: lm.name || '',
								isSelected: !!(selectedLandmarkId && lm.id === selectedLandmarkId)
							});

							landmarksSource.addFeature(feat);
							const extent = geom && geom.getExtent ? geom.getExtent() : null;
							if (extent) extents.push(extent);
							if (selectedLandmarkId && lm.id === selectedLandmarkId) selectedFeature = feat;
						}
					} catch (e: any) {
						handleError(e, 'rendering landmark');
					}
				}

				//-- If a specific landmark is selected, focus it and ensure it's highlighted. --
				if (selectedFeature) {
					try {
						const geom: any = selectedFeature.getGeometry();
						const extent = geom && geom.getExtent ? geom.getExtent() : null;
						if (extent && map && map.getView) {
							map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 300 });
						} else if (geom && geom.getType && geom.getType() === 'Point') {
							const coord = geom.getCoordinates();
							const ll = toLonLat(coord);
							map
								.getView()
								.animate({ center: fromLonLat([ll[0], ll[1]]), zoom: 14, duration: 300 });
						}

						//-- Enable modify interaction for selected circle feature --
						if (selectedFeature.get('isCircleForRectangle')) {
							setTimeout(() => {
								enableModify();
							}, 200);
						}
					} catch (e: any) {
						handleError(e, 'focusing selected landmark');
					}
				} else if (extents.length > 0) {
					//-- Fit to all landmarks so the map shows them initially --
					try {
						//-- combine extents --
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
					} catch (e: any) {
						handleError(e, 'fitting map to landmarks');
					}
				}
			}
		} catch (err: any) {
			handleError(err, 'rendering landmarks');
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

	//-- Cleanup on destroy --
	onDestroy(() => {
		stopDrawing();
		disableModify();
		if (map && _pointerMoveHandler) {
			map.un('pointermove', _pointerMoveHandler);
			_pointerMoveHandler = null;
		}
		map?.setTarget(undefined);
	});
</script>

<div bind:this={container} style="width:100%; height:100%;"></div>
