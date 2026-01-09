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
				return new Style({
					stroke: new Stroke({ color: 'rgba(16,185,129,0.95)', width: 2 }),
					fill: new Fill({ color: 'rgba(16,185,129,0.15)' }),
					image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#10b981' }) })
				});
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
					return new Style({
						stroke: new Stroke({ color: 'rgba(16,185,129,0.95)', width: 3 }),
						fill: new Fill({ color: 'rgba(16,185,129,0.15)' }),
						image: new CircleStyle({ radius: 8, fill: new Fill({ color: '#10b981' }) })
					});
				}
				//-- Default landmark style --
				const baseStyle = new Style({
					stroke: new Stroke({ color: 'rgba(0,123,255,0.9)', width: 2 }),
					fill: new Fill({ color: 'rgba(0,123,255,0.2)' }),
					image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#007bff' }) })
				});
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

	function clearPreviousDrawings() {
		// Clear vector source (all user drawings)
		if (vectorSource && typeof vectorSource.clear === 'function') {
			vectorSource.clear();
		}

		// Also remove temporary ones from landmarksSource
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
						landmarksSource.removeFeature(lf);
					}
				} catch (e) {}
			}
		}

		dispatch('drawCleared');
	}

	//-- Enable modify interaction for resizing circles --
	function enableModify() {
		if (!map || !vectorSource) return;

		// Remove existing interactions first
		disableModify();

		// Create modify interaction for circle resizing
		modifyInteraction = new Modify({
			source: vectorSource,
			// Only allow modifying circle features representing rectangles
			condition: (event) => {
				if (!event || !event.pixel) return false;

				const features = map.getFeaturesAtPixel(event.pixel, {
					layerFilter: (layer) => layer === vectorLayer || layer === landmarksLayer
				});

				if (features.length > 0) {
					const feature = features[0];
					// Only allow modification of circle-for-rectangle features
					return feature.get('isCircleForRectangle') === true;
				}
				return false;
			},
			// This makes the boundary "attractive" to cursor
			pixelTolerance: 15,
			// Style for the modify interaction (vertices)
			style: new Style({
				image: new CircleStyle({
					radius: 6,
					fill: new Fill({ color: '#ff0000' }),
					stroke: new Stroke({ color: '#ffffff', width: 2 })
				})
			})
		});

		// When circle is modified, update the backend rectangle
		modifyInteraction.on('modifyend', (event) => {
			event.features.forEach((feature) => {
				// remove live modify change handler if present
				try {
					const mh = feature.get && feature.get('modifyChangeHandler');
					const geom = feature.getGeometry && feature.getGeometry();
					if (geom && mh && geom.un && typeof mh === 'function') {
						geom.un('change', mh);
					}
				} catch (e) {}
				try {
					feature.set && feature.set('modifyChangeHandler', null);
				} catch (e) {}
				// finalize modification
				let ok = true;
				if (feature.get('isCircleForRectangle')) {
					ok = updateBackendRectangleFromCircle(feature);
					// updateBackendRectangleFromCircle handles revert and dispatch on error
				}
				// ensure style is reset appropriately after finishing
				try {
					if (!ok) {
						// modification was reverted or invalid — keep invalid/red style
						feature.set && feature.set('isInvalid', true);
						feature.setStyle &&
							feature.setStyle(
								new Style({
									stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
									fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
									image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
								})
							);
					} else {
						// successful modification — clear invalid flag and reset to default style
						feature.set && feature.set('isInvalid', false);
						if (feature && feature.setStyle) feature.setStyle(undefined);
					}
				} catch (e) {}
			});
		});

		// When modification starts, save pre-modify geometry and attach live validation listener
		modifyInteraction.on('modifystart', (event) => {
			event.features.forEach((feature) => {
				try {
					const geom = feature.getGeometry && feature.getGeometry();
					// store a clone of existing geometry so we can revert if needed
					try {
						feature.set(
							'preModifyGeom',
							geom && typeof geom.clone === 'function' ? geom.clone() : geom
						);
					} catch (e) {}

					// live change handler for modification to update style/validity
					const modHandler = () => {
						try {
							const g: any = feature.getGeometry && feature.getGeometry();
							let area = 0;
							let isValid = true;
							if (g && g.getType && g.getType() === 'Circle') {
								const center = g.getCenter();
								const radius = g.getRadius();
								const halfSide = radius * Math.SQRT1_2;
								const side = 2 * halfSide;
								area = side * side;
								const MIN_AREA = 2;
								const MAX_AREA = 5 * 1000 * 1000;
								isValid = area >= MIN_AREA && area <= MAX_AREA;
								if (isValid && landmarks && Array.isArray(landmarks)) {
									const drawnExtent = [
										center[0] - halfSide,
										center[1] - halfSide,
										center[0] + halfSide,
										center[1] + halfSide
									];
									const wkt = new WKT();
									for (const lm of landmarks) {
										if (!lm || !lm.boundary) continue;
										try {
											const feat = wkt.readFeature(lm.boundary, {
												dataProjection: 'EPSG:4326',
												featureProjection: 'EPSG:3857'
											});
											const lgeom = feat.getGeometry();
											if (
												lgeom &&
												typeof lgeom.intersectsExtent === 'function' &&
												lgeom.intersectsExtent(drawnExtent)
											) {
												const existingExtent = lgeom.getExtent();
												const overlap = !(
													drawnExtent[2] < existingExtent[0] ||
													drawnExtent[0] > existingExtent[2] ||
													drawnExtent[3] < existingExtent[1] ||
													drawnExtent[1] > existingExtent[3]
												);
												if (overlap) {
													isValid = false;
													break;
												}
											}
										} catch (e) {
											console.warn('Error checking overlap during modify live validation:', e);
										}
									}
								}
							} else {
								area = g && g.getArea ? g.getArea() : 0;
							}
							// set live style
							if (feature && feature.setStyle) {
								if (!isValid) {
									feature.setStyle(
										new Style({
											stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
											fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
											image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
										})
									);
								} else {
									feature.setStyle(undefined);
								}
							}
							// dispatch live area update
							dispatch('drawArea', { area, isValid });
						} catch (e) {
							console.warn('Error in modify live handler:', e);
						}
					};

					// attach handler to geometry change
					try {
						const g2 = feature.getGeometry && feature.getGeometry();
						if (g2 && g2.on && typeof modHandler === 'function') {
							g2.on('change', modHandler);
							feature.set && feature.set('modifyChangeHandler', modHandler);
						}
					} catch (e) {}
				} catch (e) {
					// ignore
				}
			});
		});

		// Add snap interaction to help cursor stick to circle boundary
		snapInteraction = new Snap({
			source: vectorSource,
			// Optional: customize snap behavior
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

	//-- Update backend rectangle when circle is resized --
	function updateBackendRectangleFromCircle(feature: any) {
		try {
			const geom: any = feature.getGeometry();
			if (geom.getType() === 'Circle') {
				const center = geom.getCenter();
				const radius = geom.getRadius();

				// Calculate the inscribed rectangle (square) inside the circle
				const halfSide = radius * Math.SQRT1_2;

				// Rectangle coordinates (inscribed square)
				const rectCoords = [
					[center[0] - halfSide, center[1] - halfSide],
					[center[0] + halfSide, center[1] - halfSide],
					[center[0] + halfSide, center[1] + halfSide],
					[center[0] - halfSide, center[1] + halfSide],
					[center[0] - halfSide, center[1] - halfSide]
				];

				// Calculate area for validation
				const side = 2 * halfSide;
				const area = side * side;

				// Validate area limits
				const MIN_AREA = 2; // m^2
				const MAX_AREA = 5 * 1000 * 1000; // 5 km^2 => 5,000,000 m^2

				if (area > MAX_AREA || area < MIN_AREA) {
					let msg = '';
					if (area > MAX_AREA) msg = 'Boundary exceeds maximum allowed area (5 km²).';
					else msg = 'Boundary area is too small (minimum 2 m²).';

					// Show alert to user
					try {
						window && window.alert && window.alert(msg);
					} catch (e) {}

					// Dispatch error
					dispatch('drawError', { message: msg });

					// Keep the modified geometry but mark as invalid so the user can edit it
					try {
						feature.set && feature.set('drawnByUser', true);
						feature.set && feature.set('isInvalid', true);
						// store backend rectangle coords and circle properties for UI
						feature.set && feature.set('backendRectCoords', rectCoords);
						feature.set && feature.set('circleRadius', radius);
						feature.set && feature.set('circleCenter', center);
						// apply invalid (red) style so user sees it immediately
						feature.setStyle &&
							feature.setStyle(
								new Style({
									stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
									fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
									image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
								})
							);
					} catch (e) {}
					// clear any previously stored valid boundary so parent doesn't keep old WKT
					try {
						boundary = null;
						// Only dispatch drawCleared if drawError was not dispatched
						if (!feature.get('isInvalid')) {
							dispatch('drawCleared');
						}
					} catch (e) {}
					return false; // Stop further processing but keep user-modified geometry
				}

				// Overlap check with existing boundaries
				const drawnExtent = [
					rectCoords[0][0],
					rectCoords[0][1],
					rectCoords[2][0],
					rectCoords[2][1]
				];

				let overlapFound = false;
				let overlappingLandmarkName = '';
				const currentLandmarkId = feature.get('landmarkId');

				if (drawnExtent && landmarks && Array.isArray(landmarks)) {
					const wkt = new WKT();
					for (const lm of landmarks) {
						// Skip the current landmark if we're modifying it
						if (
							currentLandmarkId &&
							(lm.id === currentLandmarkId || lm._id === currentLandmarkId)
						) {
							continue;
						}

						if (!lm || !lm.boundary) continue;
						try {
							const feat = wkt.readFeature(lm.boundary, {
								dataProjection: 'EPSG:4326',
								featureProjection: 'EPSG:3857'
							});
							const lgeom = feat.getGeometry();
							if (
								lgeom &&
								typeof lgeom.intersectsExtent === 'function' &&
								lgeom.intersectsExtent(drawnExtent)
							) {
								const existingExtent = lgeom.getExtent();

								// Check if extents overlap
								const overlap = !(
									drawnExtent[2] < existingExtent[0] ||
									drawnExtent[0] > existingExtent[2] ||
									drawnExtent[3] < existingExtent[1] ||
									drawnExtent[1] > existingExtent[3]
								);

								if (overlap) {
									overlapFound = true;
									overlappingLandmarkName = lm.name || lm.id || 'Unknown landmark';
									break;
								}
							}
						} catch (e) {
							console.warn('Error checking overlap with landmark:', e);
						}
					}
				}

				if (overlapFound) {
					let msg = `Boundary overlaps with an existing landmark (${overlappingLandmarkName}).`;
					// Show alert to user
					try {
						window && window.alert && window.alert(msg);
					} catch (e) {}

					// Dispatch error
					dispatch('drawError', { message: msg });

					// Keep the modified geometry but mark as invalid so the user can edit it
					try {
						feature.set && feature.set('drawnByUser', true);
						feature.set && feature.set('isInvalid', true);
						// also store backend rectangle props from this attempt
						feature.set && feature.set('backendRectCoords', rectCoords);
						feature.set && feature.set('circleRadius', radius);
						feature.set && feature.set('circleCenter', center);
						feature.setStyle &&
							feature.setStyle(
								new Style({
									stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
									fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
									image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
								})
							);
					} catch (e) {}
					// clear any previously stored valid boundary so parent doesn't keep old WKT
					try {
						boundary = null;
						// Only dispatch drawCleared if drawError was not dispatched
						if (!feature.get('isInvalid')) {
							dispatch('drawCleared');
						}
					} catch (e) {}
					return false; // Stop further processing but keep user-modified geometry
				}

				// Convert to lon/lat for WKT
				const lonlatCoords = rectCoords.map((c: any) => {
					const ll = toLonLat(c);
					return `${ll[0]} ${ll[1]}`;
				});

				const boundaryWkt = `POLYGON((${lonlatCoords.join(',')}))`;

				// Update feature properties
				feature.set('backendRectCoords', rectCoords);
				feature.set('circleRadius', radius);
				feature.set('circleCenter', center);

				// Dispatch event with updated boundary
				dispatch('drawComplete', { area, boundary: boundaryWkt });
				boundary = boundaryWkt;

				// Also update landmarks source if this is a landmark
				if (feature.get('landmarkId')) {
					const lfs = landmarksSource.getFeatures();
					for (const lf of lfs) {
						if (lf.get('landmarkId') === feature.get('landmarkId')) {
							lf.set('backendRectCoords', rectCoords);
							lf.set('circleRadius', radius);
							lf.set('circleCenter', center);
							break;
						}
					}
				}

				return true;
			}
			return false;
		} catch (e) {
			console.warn('Error updating backend rectangle from circle:', e);
			return false;
		}
	}

	export function startDrawing(
		type: 'Point' | 'LineString' | 'Polygon' | 'Rectangle',
		opts: { keepExisting?: boolean } = {}
	) {
		if (!map || !vectorSource) return;

		_currentDrawingType = type;
		_isDrawingActive = true;

		// stop any current draw interaction
		stopDrawing();
		const keepExisting = !!opts.keepExisting;
		// choose draw options; on touch prefer freehand for easier drawing
		const touch = isTouchDevice();
		// style used while drawing (valid) — use green theme to match modify visuals
		const drawingStyle = new Style({
			stroke: new Stroke({ color: 'rgba(16,185,129,0.95)', width: 2 }),
			fill: new Fill({ color: 'rgba(16,185,129,0.15)' }),
			image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#10b981' }) })
		});
		const drawOpts: any = {
			source: vectorSource,
			type: type === 'Rectangle' ? 'Circle' : type,
			style: drawingStyle
		};
		if (touch) {
			// freehand allows single-finger drawing on mobile
			drawOpts.freehand = true;
			// accept touch input without modifier keys
			drawOpts.condition = () => true;
		}
		drawInteraction = new Draw(drawOpts);
		map.addInteraction(drawInteraction);

		// Clear previous drawings unless caller requested we keep existing boundary visuals
		if (!keepExisting) {
			// live area updates: on drawstart attach geometry change listener
			// CLEAR PREVIOUS DRAWINGS AS SOON AS USER STARTS DRAWING (first click)
			// This preserves existing backend boundary visuals when requested (sidebar edit UX)
			// Note: we still remove user-drawn temporary features when not keeping existing.
			// The actual clear happens inside the drawstart handler below for consistency.
		}

		// live area updates: on drawstart attach geometry change listener
		_drawStartHandler = (evt: any) => {
			// CLEAR PREVIOUS DRAWINGS AS SOON AS USER STARTS DRAWING (first click)
			// Skip clearing when caller requested to keep existing visuals (sidebar edit UX)
			if (!keepExisting) {
				clearPreviousDrawings();
			}

			const feature = evt.feature;
			// Mark circle features for rectangle conversion
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
						// For rectangle: area is based on the inscribed rectangle (diameter^2/2)
						const radius = geom.getRadius();
						const rectSide = radius * Math.sqrt(2); // diagonal = diameter, so side = radius * sqrt(2)
						area = rectSide * rectSide; // area of the inscribed square
					} else {
						area = geom.getArea ? geom.getArea() : 0;
					}

					// Live validation
					const MIN_AREA = 2; // m^2
					const MAX_AREA = 5 * 1000 * 1000; // 5 km^2
					let isValid = area >= MIN_AREA && area <= MAX_AREA;

					// Overlap check (live) - FIXED: Use rectangle extent for all comparisons
					if (isValid && landmarks && Array.isArray(landmarks)) {
						let drawnGeom = geom;
						let drawnExtent = null;
						if (drawnGeom.getType() === 'Circle' && type === 'Rectangle') {
							// For rectangle: check the inscribed rectangle extent
							const center = drawnGeom.getCenter();
							const radius = drawnGeom.getRadius();
							const halfSide = radius * Math.SQRT1_2; // side/2 = radius * sqrt(2)/2
							drawnExtent = [
								center[0] - halfSide,
								center[1] - halfSide,
								center[0] + halfSide,
								center[1] + halfSide
							];
						} else if (drawnGeom.getType() === 'Polygon') {
							drawnExtent = drawnGeom.getExtent();
						}

						if (drawnExtent) {
							const wkt = new WKT();
							for (const lm of landmarks) {
								if (!lm || !lm.boundary) continue;
								try {
									const feat = wkt.readFeature(lm.boundary, {
										dataProjection: 'EPSG:4326',
										featureProjection: 'EPSG:3857' // FIXED: Convert to same projection
									});
									const lgeom = feat.getGeometry();
									if (
										lgeom &&
										typeof lgeom.intersectsExtent === 'function' &&
										lgeom.intersectsExtent(drawnExtent)
									) {
										// Get the rectangle extent of the existing landmark
										let existingExtent = lgeom.getExtent();

										// Check if extents overlap
										const overlap = !(
											drawnExtent[2] < existingExtent[0] ||
											drawnExtent[0] > existingExtent[2] ||
											drawnExtent[3] < existingExtent[1] ||
											drawnExtent[1] > existingExtent[3]
										);

										if (overlap) {
											isValid = false;
											break;
										}
									}
								} catch (e) {
									console.warn('Error checking overlap with landmark:', e);
								}
							}
						}
					}

					// Set style based on validity
					if (feature && feature.setStyle) {
						if (!isValid) {
							feature.setStyle(
								new Style({
									stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
									fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
									image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
								})
							);
						} else {
							// apply drawing style while drawing so user sees yellow in-progress
							feature.setStyle(drawingStyle);
						}
					}

					dispatch('drawArea', { area, isValid });
				} catch (e) {
					console.warn('Error in geometry change handler:', e);
				}
			};
			try {
				feature.getGeometry().on('change', _geomChangeHandler);
			} catch (e) {
				// ignore
			}
		};
		drawInteraction.on('drawstart', _drawStartHandler);

		// on drawend dispatch final area and cleanup geom change listener
		_drawEndHandler = (evt: any) => {
			try {
				const feature = evt.feature;
				const geom: any = feature.getGeometry();
				let area = 0;
				let boundaryWkt: string | null = null;

				if (type === 'Rectangle') {
					// Get circle parameters
					const center = geom.getCenter();
					const radius = geom.getRadius();

					// Calculate the inscribed rectangle (square) that fits inside the circle
					const halfSide = radius * Math.SQRT1_2; // side/2 = radius * sqrt(2)/2

					// Rectangle coordinates (inscribed square within the circle)
					const rectCoords = [
						[center[0] - halfSide, center[1] - halfSide],
						[center[0] + halfSide, center[1] - halfSide],
						[center[0] + halfSide, center[1] + halfSide],
						[center[0] - halfSide, center[1] + halfSide],
						[center[0] - halfSide, center[1] - halfSide]
					];

					// Area of the inscribed square
					const side = 2 * halfSide;
					area = side * side;

					// Convert to lon/lat for WKT
					const lonlatCoords = rectCoords.map((c: any) => {
						const ll = toLonLat(c);
						return `${ll[0]} ${ll[1]}`;
					});
					boundaryWkt = `POLYGON((${lonlatCoords.join(',')}))`;

					// Store backend rectangle coords on feature (not rendered)
					feature.set('backendRectCoords', rectCoords);
					feature.set('circleRadius', radius);
					feature.set('circleCenter', center);
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

				// Validate area limits at draw end
				const MIN_AREA = 2; // m^2
				const MAX_AREA = 5 * 1000 * 1000; // 5 km^2 => 5,000,000 m^2
				if (area > MAX_AREA || area < MIN_AREA) {
					let msg = '';
					if (area > MAX_AREA) msg = 'Boundary exceeds maximum allowed area (5 km²).';
					else msg = 'Boundary area is too small (minimum 2 m²).';
					// Show alert first
					try {
						window && window.alert && window.alert(msg);
					} catch (e) {}
					// Keep the invalid feature visible and allow user to modify it
					if (_geomChangeHandler && feature && feature.getGeometry) {
						try {
							feature.getGeometry().un && feature.getGeometry().un('change', _geomChangeHandler);
						} catch (e) {}
						_geomChangeHandler = null;
					}
					try {
						// mark as user drawn and invalid so edit UI can treat it specially
						feature.set && feature.set('drawnByUser', true);
						feature.set && feature.set('isInvalid', true);
						// set invalid style so user sees it immediately
						feature.setStyle &&
							feature.setStyle(
								new Style({
									stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
									fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
									image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
								})
							);
					} catch (e) {}
					boundary = null;
					dispatch('drawError', { message: msg });
					// enable modify so user can adjust this invalid boundary
					setTimeout(() => {
						try {
							enableModify();
						} catch (e) {}
					}, 0);
					return;
				}

				// Overlap check with existing boundaries - FIXED
				let drawnGeom = feature.getGeometry();
				let drawnExtent = null;
				if (drawnGeom.getType() === 'Circle' && type === 'Rectangle') {
					// For rectangle: check the inscribed rectangle extent
					const center = drawnGeom.getCenter();
					const radius = drawnGeom.getRadius();
					const halfSide = radius * Math.SQRT1_2;
					drawnExtent = [
						center[0] - halfSide,
						center[1] - halfSide,
						center[0] + halfSide,
						center[1] + halfSide
					];
				} else if (drawnGeom.getType() === 'Polygon') {
					drawnExtent = drawnGeom.getExtent();
				}

				let overlapFound = false;
				if (drawnExtent && landmarks && Array.isArray(landmarks)) {
					const wkt = new WKT();
					for (const lm of landmarks) {
						if (!lm || !lm.boundary) continue;
						try {
							const feat = wkt.readFeature(lm.boundary, {
								dataProjection: 'EPSG:4326',
								featureProjection: 'EPSG:3857' // FIXED: Convert to same projection
							});
							const lgeom = feat.getGeometry();
							if (
								lgeom &&
								typeof lgeom.intersectsExtent === 'function' &&
								lgeom.intersectsExtent(drawnExtent)
							) {
								const existingExtent = lgeom.getExtent();

								// Check if extents overlap
								const overlap = !(
									drawnExtent[2] < existingExtent[0] ||
									drawnExtent[0] > existingExtent[2] ||
									drawnExtent[3] < existingExtent[1] ||
									drawnExtent[1] > existingExtent[3]
								);

								if (overlap) {
									overlapFound = true;
									console.log('Overlap found with landmark:', lm.name || lm.id, {
										drawnExtent,
										existingExtent
									});
									break;
								}
							}
						} catch (e) {
							console.warn('Error checking overlap with landmark:', e);
						}
					}
				}

				if (overlapFound) {
					let msg = 'Boundary overlaps with an existing landmark.';
					// Show alert first
					try {
						window && window.alert && window.alert(msg);
					} catch (e) {}
					// Keep the invalid feature visible and allow user to modify it
					if (_geomChangeHandler && feature && feature.getGeometry) {
						try {
							feature.getGeometry().un && feature.getGeometry().un('change', _geomChangeHandler);
						} catch (e) {}
						_geomChangeHandler = null;
					}
					try {
						feature.set && feature.set('drawnByUser', true);
						feature.set && feature.set('isInvalid', true);
						feature.setStyle &&
							feature.setStyle(
								new Style({
									stroke: new Stroke({ color: 'rgba(255,0,0,0.9)', width: 2 }),
									fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
									image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0000' }) })
								})
							);
					} catch (e) {}
					boundary = null;
					dispatch('drawError', { message: msg });
					setTimeout(() => {
						try {
							enableModify();
						} catch (e) {}
					}, 0);
					return;
				}

				// boundary is valid — reflect it in internal state before notifying parent
				try {
					boundary = boundaryWkt;
				} catch (e) {}
				dispatch('drawComplete', { area, boundary: boundaryWkt });

				// Mark this feature as drawnByUser
				try {
					if (evt && evt.feature) {
						evt.feature.set && evt.feature.set('drawnByUser', true);
					}
				} catch (e) {}

				// Enable modify interaction for resizing after drawing is complete
				if (type === 'Rectangle') {
					setTimeout(() => {
						enableModify();
					}, 100);
				}
			} catch (e) {
				console.warn('Error in draw end handler:', e);
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
		_isDrawingActive = false;
		// restore DragPan when drawing stops
		try {
			if (_dragPanInteraction && typeof _dragPanInteraction.setActive === 'function') {
				_dragPanInteraction.setActive(true);
			}
			_dragPanInteraction = null;
		} catch (e) {}
	}

	export function clearDrawings() {
		clearPreviousDrawings();
		_isDrawingActive = false;
		disableModify();
	}

	//-- Expose modify functions for external control --
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

						// If polygon (rectangle stored as WKT), calculate the enclosing circle
						if (geom && geom.getType && geom.getType() === 'Polygon') {
							const extent = geom.getExtent();
							if (extent) {
								const center = getCenter(extent);
								const dx = extent[2] - extent[0];
								const dy = extent[3] - extent[1];
								// Calculate the circle that encloses the rectangle
								// The circle's diameter should be the diagonal of the rectangle
								const diagonal = Math.sqrt(dx * dx + dy * dy);
								const radius = diagonal / 2;

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
						console.warn('Error parsing landmark boundary:', e);
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
							map
								.getView()
								.animate({ center: fromLonLat([ll[0], ll[1]]), zoom: 14, duration: 300 });
						}

						// Enable modify interaction for selected circle feature
						if (selectedFeature.get('isCircleForRectangle')) {
							setTimeout(() => {
								enableModify();
							}, 200);
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
		disableModify();
		if (map && _pointerMoveHandler) {
			map.un('pointermove', _pointerMoveHandler);
			_pointerMoveHandler = null;
		}
		map?.setTarget(undefined);
	});
</script>

<div bind:this={container} style="width:100%; height:100%;"></div>
