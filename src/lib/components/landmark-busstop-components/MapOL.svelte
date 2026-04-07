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
	import Collection from 'ol/Collection';
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
	import LineString from 'ol/geom/LineString';
	import Polygon from 'ol/geom/Polygon';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import {
		GeometryUtils,
		ValidationUtils,
		StyleUtils,
		FeatureUtils,
		InteractionUtils
	} from '../../utils/openlayers.utils';
	import Icon from 'ol/style/Icon';
	import BusstopImg from '$lib/assets/busstopimage.png';
	import LocationIcon from '$lib/assets/location_icon.png';
	import toast from '$lib/utils/toast';

	//-- Props --
	export let center = { lat: 15.8505, lng: 71.162711 };
	export let zoom = 7;
	export let selectedProvider: string = 'OpenStreetMap';
	export let providerUrl: string = '';
	export let providerAttribution: string = '';
	export let providerMaxZoom: number = 19;
	export let boundary: any = null;
	export let landmarks: any[] = [];
	export let busStops: any[] = [];
	export let selectedLandmarkId: string | null = null;
	export let modifyEnabled: boolean = false;
	export let editingBusStopId: string | null = null; //-- ID of bus stop currently being edited (for drag interaction) --
	export let overlappingLandmarkId: string | null = null; //-- ID of landmark that overlaps during drawing (for showing square) --
	export let drawnRectCoords: number[][] | null = null; //-- Rectangle coordinates of the currently drawn boundary (for showing square during overlap) --
	export let routePath: Array<{
		lon: number;
		lat: number;
		label?: string;
		sequence?: number;
		boundary?: string;
		landmarkId?: string;
	}> = []; //-- Ordered route path points for connecting landmarks --
	export let autoFitLandmarks: boolean = true; //-- When false, skip fitting the map to landmark extents on updates (used for viewport-based fetching) --

	//-- Variables --
	let container: HTMLDivElement;
	let map: Map;
	let tileLayer: TileLayer<any>;
	let vectorSource: any;
	let vectorLayer: VectorLayer<any>;
	let landmarksSource: any;
	let landmarksLayer: VectorLayer<any>;
	let busStopsSource: any;
	let busStopsLayer: VectorLayer<any>;

	//-- Route path layer (for connecting landmarks in sequence)
	let routePathSource: any;
	let routePathLayer: VectorLayer<any>;

	//-- Search marker layer (for geocoding results)
	let searchMarkerSource: any;
	let searchMarkerLayer: VectorLayer<any>;
	let _searchMarkerFeature: Feature | null = null;
	let drawInteraction: Draw | null = null;
	let modifyInteraction: Modify | null = null;
	let snapInteraction: Snap | null = null;
	let snapInteractionLandmark: Snap | null = null;
	let busStopModifyInteraction: Modify | null = null;
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
	let _moveEndHandler: any = null;
	let _drawnOverlapSquareFeature: Feature | null = null; //-- Temporary feature showing the drawn rectangle during overlap --
	let _existingOverlapSquareFeature: Feature | null = null; //-- Temporary feature showing the existing landmark's rectangle during overlap --

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

	//-- Security: escape HTML in user-supplied attributions to prevent XSS
	function escapeHtml(str: string | undefined): string | undefined {
		if (!str) return undefined;
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	//-- Utility to detect touch devices --
	const isTouchDevice = () =>
		typeof window !== 'undefined' &&
		('ontouchstart' in window || (navigator && (navigator as any).maxTouchPoints > 0));

	//-- Utility to update map size --
	export function updateSize() {
		map?.updateSize();
	}

	//-- Pan and zoom the map to a specific location --
	export function panTo(lon: number, lat: number, zoomLevel: number = 15) {
		if (!map) return;
		const view = map.getView();
		view.animate({
			center: fromLonLat([lon, lat]),
			zoom: zoomLevel,
			duration: 500
		});
	}

	//-- Place a search result marker at specified lon/lat (label optional)
	export function setSearchMarker(lon: number, lat: number, label?: string) {
		try {
			if (!map || !searchMarkerSource) return;
			// clear previous
			clearSearchMarker();
			const coord = fromLonLat([lon, lat]);
			const feat = new Feature(new Point(coord));
			feat.set('label', label || '');
			searchMarkerSource.addFeature(feat);
			_searchMarkerFeature = feat;
		} catch (e) {
			handleError(e, 'setSearchMarker');
		}
	}

	export function clearSearchMarker() {
		try {
			if (searchMarkerSource && _searchMarkerFeature) {
				searchMarkerSource.removeFeature(_searchMarkerFeature);
				_searchMarkerFeature = null;
			}
		} catch (e) {
			handleError(e, 'clearSearchMarker');
		}
	}

	//-- Create vector layer for search result marker --
	function createSearchMarkerLayer() {
		searchMarkerSource = new VectorSource({ wrapX: false });
		searchMarkerLayer = new VectorLayer({
			zIndex: 1050,
			declutter: true,
			source: searchMarkerSource,
			style: (feature) => {
				const label = feature.get('label') || '';
				const iconStyle = new Style({
					image: new Icon({
						src: LocationIcon,
						scale: 0.9,
						crossOrigin: 'anonymous',
						anchor: [0.5, 1]
					})
				});
				//-- create a simple text style that renders below the icon
				const textStyle = new Style({
					text: new Text({
						text: label || '',
						font: '600 14px Inter, Arial, sans-serif',
						fill: new Fill({ color: '#0b3b66' }),
						stroke: new Stroke({ color: '#fff', width: 3 }),
						offsetY: 12,
						textAlign: 'center',
						textBaseline: 'top',
						overflow: true
					})
				});
				return [iconStyle, textStyle];
			}
		});
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

	//-- Create vector layer for bus stops (point markers + label) --
	function createBusStopLayer() {
		busStopsSource = new VectorSource({ wrapX: false });
		busStopsLayer = new VectorLayer({
			source: busStopsSource,
			style: (feature) => {
				const name = feature.get('name') || '';
				const isEditing = feature.get('isEditing') || false;

				//-- Highlighted style for the bus stop being edited --
				if (isEditing) {
					return new Style({
						image: new Icon({
							src: BusstopImg,
							scale: 0.1, //-- Larger scale for editing --
							anchor: [0.5, 1]
						}),
						text: new Text({
							text: name,
							font: '600 13px Inter, sans-serif',
							fill: new Fill({ color: '#dc2626' }), //-- Red text for editing --
							stroke: new Stroke({ color: '#ffffff', width: 4 }),
							textAlign: 'center',
							textBaseline: 'top',
							offsetX: 0,
							offsetY: 18,
							overflow: true
						})
					});
				}

				//-- Default style --
				return new Style({
					image: new Icon({
						src: BusstopImg,
						scale: 0.07,
						anchor: [0.5, 1]
					}),
					text: new Text({
						text: name,
						font: '400 12px Inter, sans-serif',
						fill: new Fill({ color: '#1f2937' }),
						stroke: new Stroke({ color: '#ffffff', width: 3 }),
						textAlign: 'center',
						textBaseline: 'top',
						offsetX: 0,
						offsetY: 14,
						overflow: true
					})
				});
			}
		});
	}

	//-- Create vector layer for route path (line + numbered markers) --
	function createRoutePathLayer() {
		routePathSource = new VectorSource({ wrapX: false });
		routePathLayer = new VectorLayer({
			source: routePathSource,
			style: (feature) => {
				const featureType = feature.get('routeFeatureType');
				if (featureType === 'line') {
					return new Style({
						stroke: new Stroke({
							color: 'rgba(13, 110, 253, 0.85)',
							width: 2.5,
							lineDash: [10, 8]
						}),
						zIndex: 1 //-- Lower z-index so landmark badges appear above line --
					});
				}
				if (featureType === 'circle') {
					const geom = feature.getGeometry();
					const label = feature.get('label') || '';
					const seq = feature.get('sequence') || '';
					let circleCenter: number[] = [0, 0];
					let circleRadius = 0;
					if (geom instanceof CircleGeom) {
						circleCenter = geom.getCenter();
						circleRadius = geom.getRadius();
					}
					const styles: Style[] = [
						//-- Circle boundary --
						new Style({
							stroke: new Stroke({ color: 'rgba(220, 38, 38, 0.85)', width: 2.5 }),
							fill: new Fill({ color: 'rgba(220, 38, 38, 0.08)' }),
							geometry: new CircleGeom(circleCenter, circleRadius)
						})
					];
					//-- Center dot with sequence number --
					if (seq) {
						styles.push(
							new Style({
								image: new CircleStyle({
									radius: 10,
									fill: new Fill({ color: 'rgba(220, 38, 38, 1)' }),
									stroke: new Stroke({ color: '#fff', width: 2.5 })
								}),
								text: new Text({
									text: String(seq),
									font: '700 11px Inter, Arial, sans-serif',
									fill: new Fill({ color: '#ffffff' }),
									overflow: true
								}),
								geometry: new Point(circleCenter)
							})
						);
					}
					//-- Label above circle --
					if (label) {
						styles.push(
							new Style({
								text: new Text({
									text: label,
									font: '600 12px Inter, Arial, sans-serif',
									fill: new Fill({ color: 'rgba(139, 0, 0, 1)' }),
									stroke: new Stroke({ color: 'rgba(255,255,255,0.95)', width: 3 }),
									offsetY: -24,
									overflow: true
								}),
								geometry: new Point(circleCenter)
							})
						);
					}
					return styles;
				}
				if (featureType === 'marker') {
					const seq = feature.get('sequence') || '';
					const label = feature.get('label') || '';
					const markerStyle = new Style({
						image: new CircleStyle({
							radius: 14,
							fill: new Fill({ color: 'rgba(220, 38, 38, 1)' }),
							stroke: new Stroke({ color: '#fff', width: 2.5 })
						}),
						text: new Text({
							text: String(seq),
							font: '700 11px Inter, Arial, sans-serif',
							fill: new Fill({ color: '#ffffff' }),
							overflow: true
						})
					});
					const labelStyle = new Style({
						text: new Text({
							text: label,
							font: '600 12px Inter, Arial, sans-serif',
							fill: new Fill({ color: 'rgba(139, 0, 0, 1)' }),
							stroke: new Stroke({ color: 'rgba(255,255,255,0.95)', width: 3 }),
							offsetY: -24,
							overflow: true
						})
					});
					return label ? [markerStyle, labelStyle] : [markerStyle];
				}
				return new Style({});
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

				//-- Route landmark: amber/orange circle with sequence number at center --
				const isRoute = !!feature.get('isRouteLandmark');
				if (isRoute) {
					const seq = feature.get('routeSequence') || '';
					const label = feature.get('landmarkName') || '';
					const geom = feature.getGeometry();
					let circleCenter: number[] = [0, 0];
					let circleRadius = 0;
					if (geom instanceof CircleGeom) {
						circleCenter = geom.getCenter();
						circleRadius = geom.getRadius();
					}
					const styles: Style[] = [
						//-- Circle boundary (z-index lower so line draws under badge) --
						new Style({
							stroke: new Stroke({ color: 'rgba(13, 110, 253, 0.85)', width: 2.5 }),
							fill: new Fill({ color: 'rgba(13, 110, 253, 0.08)' }),
							geometry: new CircleGeom(circleCenter, circleRadius),
							zIndex: 1
						})
					];
					if (seq) {
						styles.push(
							new Style({
								image: new CircleStyle({
									radius: 12,
									fill: new Fill({ color: 'rgba(13, 110, 253, 1)' }),
									stroke: new Stroke({ color: '#fff', width: 2.5 })
								}),
								text: new Text({
									text: String(seq),
									font: '700 12px Inter, Arial, sans-serif',
									fill: new Fill({ color: '#ffffff' }),
									overflow: true
								}),
								geometry: new Point(circleCenter),
								zIndex: 10
							})
						);
					}
					if (label) {
						styles.push(
							new Style({
								text: new Text({
									text: label,
									font: '600 12px Inter, Arial, sans-serif',
									fill: new Fill({ color: 'rgba(13, 110, 253, 1)' }),
									stroke: new Stroke({ color: 'rgba(255,255,255,0.95)', width: 3 }),
									offsetY: -24,
									overflow: true
								}),
								geometry: new Point(circleCenter),
								zIndex: 10
							})
						);
					}
					return styles;
				}

				//-- Default landmark style --
				const baseStyle = StyleUtils.createStyle('default');
				//-- Add a text label above the feature if a name is available --
				const label = feature.get('landmarkName') || '';
				if (label) {
					let labelGeom: any = null;
					try {
						const geom: any = feature.getGeometry();
						//-- compute a top-center label position for various geometry types --
						const viewRes =
							map && map.getView && map.getView().getResolution
								? map.getView().getResolution()
								: null;
						const pixelPad = 16;

						if (geom && geom.getType && geom.getType() === 'Point') {
							try {
								const coords = geom.getCoordinates();
								const pad = viewRes ? viewRes * pixelPad : widthOrFallback(geom) * 0.06 || 1e-4;
								labelGeom = new Point([coords[0], coords[1] + pad]);
							} catch (e) {
								labelGeom = geom;
							}
						} else if (geom && geom.getType && geom.getType() === 'Circle') {
							try {
								let center: any = null;
								let radius = 0;
								if (geom instanceof CircleGeom) {
									center = geom.getCenter();
									radius = geom.getRadius();
								} else if (geom.getExtent) {
									const ext = geom.getExtent();
									center = getCenter(ext);
									radius = Math.max((ext[2] - ext[0]) / 2, (ext[3] - ext[1]) / 2);
								}
								const pad = viewRes ? viewRes * pixelPad : radius * 0.06;
								labelGeom = new Point([center[0], center[1] + radius + pad]);
							} catch (e) {
								labelGeom = new Point(getCenter(geom.getExtent ? geom.getExtent() : [0, 0, 0, 0]));
							}
						} else if (geom && geom.getExtent) {
							//-- place label just above the top-center of the geometry's extent --
							const extent = geom.getExtent();
							const minX = extent[0];
							const minY = extent[1];
							const maxX = extent[2];
							const maxY = extent[3];
							const width = maxX - minX;
							const height = maxY - minY;
							//-- padding in map units (convert desired pixel padding to map units when possible) --
							const padFromRes = viewRes
								? viewRes * pixelPad
								: Math.max(height * 0.06, width * 0.02);
							const padding = Math.max(height * 0.02, padFromRes);
							const topCenter = [(minX + maxX) / 2, maxY + padding];
							labelGeom = new Point(topCenter);
						}

						//-- helper: try to derive a width-like fallback for point padding --
						function widthOrFallback(g: any) {
							try {
								const ext = g.getExtent ? g.getExtent() : null;
								if (ext) return ext[2] - ext[0];
							} catch (e) {}
							return 0.0001;
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
	function enableLandmarkModify() {
		//-- Respect parent-controlled flag: do not enable modify unless explicitly allowed --
		if (!map || !vectorSource || !modifyEnabled) return;
		//-- Remove existing interactions first --
		disableLandmarkModify();

		//-- Build a features collection to allow modifying features that may live in either --
		//-- the user-draw vector source or the landmarks source (selected landmark). --
		const featuresCollection: any = new Collection();
		try {
			//-- If a landmark feature is selected, prefer making only that feature editable --
			if (landmarksSource && typeof landmarksSource.getFeatures === 'function') {
				const selected = (landmarksSource.getFeatures() || []).filter(
					(f: any) => f.get && f.get('isSelected')
				);
				if (selected && selected.length > 0) {
					selected.forEach((f: any) => featuresCollection.push(f));
				}
			}

			//-- If no selected landmark was found, fall back to user-drawn features (vectorSource) --
			if (
				featuresCollection.getLength() === 0 &&
				vectorSource &&
				typeof vectorSource.getFeatures === 'function'
			) {
				const drawn = (vectorSource.getFeatures() || []).filter(
					(f: any) => f.get && (f.get('drawnByUser') || f.get('isCircleForRectangle'))
				);
				drawn.forEach((f: any) => featuresCollection.push(f));
			}
		} catch (e: any) {
			handleError(e, 'building modify features collection');
		}

		const wktFormat = new WKT();

		//-- Create modify interaction for circle resizing --
		modifyInteraction = new Modify({
			features: featuresCollection,
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

					//-- Detect actual geometry type for validation --
					//-- Circle features (for rectangle) should be validated as 'Rectangle' --
					let modifyDrawingType: 'Rectangle' | 'Polygon' = 'Rectangle';
					if (geom && geom.getType && geom.getType() === 'Circle') {
						modifyDrawingType = 'Rectangle';
					} else if (feature.get('isCircleForRectangle')) {
						modifyDrawingType = 'Rectangle';
					}

					//-- Create and attach live change handler --
					const modHandler = InteractionUtils.createModifyChangeHandler(
						feature,
						landmarks,
						modifyDrawingType,
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

		//-- If we're editing a selected landmark that lives in the landmarks source,
		//-- add an additional snap interaction for that source so vertices snap correctly.
		if (landmarksSource && featuresCollection.getLength() > 0) {
			snapInteractionLandmark = new Snap({
				source: landmarksSource,
				pixelTolerance: 10
			});
			map.addInteraction(snapInteractionLandmark);
		}

		map.addInteraction(modifyInteraction);
		map.addInteraction(snapInteraction);
		_isModifyEnabled = true;
	}

	//-- Disable modify interaction --
	function disableLandmarkModify() {
		if (!map) return;
		if (modifyInteraction) {
			map.removeInteraction(modifyInteraction);
			modifyInteraction = null;
		}
		if (snapInteraction) {
			map.removeInteraction(snapInteraction);
			snapInteraction = null;
		}
		if (snapInteractionLandmark) {
			map.removeInteraction(snapInteractionLandmark);
			snapInteractionLandmark = null;
		}
		_isModifyEnabled = false;
	}

	//-- Enable bus stop drag interaction for the editing bus stop --
	function enableBusStopModify(busStopId: string) {
		if (!map || !busStopsSource) return;
		disableBusStopModify();

		//-- Find the feature with matching busStopId --
		const features = busStopsSource.getFeatures();
		const editFeature = features.find((f: Feature) => f.get('busStopId') === busStopId);
		if (!editFeature) return;

		//-- Mark this feature as editable --
		editFeature.set('isEditing', true);

		//-- Change cursor to crosshair for better UX --
		const viewport = map.getViewport();
		if (viewport) {
			viewport.style.cursor = 'crosshair';
		}

		//-- Create a collection with only this feature --
		const editCollection = new Collection([editFeature]);

		const wktFormat = new WKT();

		//-- Create modify interaction for this bus stop only --
		busStopModifyInteraction = new Modify({
			features: editCollection,
			pixelTolerance: 30, //-- Larger tolerance for easier selection --
			style: new Style({
				image: new Icon({
					src: BusstopImg,
					scale: 0.1, //-- Slightly larger when dragging --
					anchor: [0.5, 1],
					opacity: 0.8
				})
			})
		});

		//-- On modify end, validate and emit new location --
		busStopModifyInteraction.on('modifyend', (event) => {
			try {
				const modifiedFeature = event.features.getArray()[0];
				if (!modifiedFeature) return;

				const geom = modifiedFeature.getGeometry() as Point;
				if (!geom || geom.getType() !== 'Point') return;

				const coords = geom.getCoordinates();

				//-- Validate that the new position is inside the selected landmark --
				const validation = ValidationUtils.validateBusStopLocation(
					coords,
					landmarks,
					selectedLandmarkId,
					wktFormat
				);

				if (!validation.isValid) {
					//-- Revert to original position by re-rendering bus stops --
					dispatch('busStopDragError', { message: validation.message });
					//-- Alert the user --
					toast.error(validation.message || 'Bus stop must be inside the landmark boundary.');
					return;
				}

				//-- Convert to WKT and dispatch --
				const lonLat = toLonLat(coords);
				const locationWkt = `POINT(${lonLat[0]} ${lonLat[1]})`;

				dispatch('busStopLocationUpdated', {
					busStopId,
					location: locationWkt
				});
			} catch (e: any) {
				handleError(e, 'bus stop modify end');
			}
		});

		map.addInteraction(busStopModifyInteraction);
	}

	//-- Disable bus stop drag interaction --
	function disableBusStopModify() {
		if (!map) return;
		if (busStopModifyInteraction) {
			map.removeInteraction(busStopModifyInteraction);
			busStopModifyInteraction = null;
		}
		//-- Reset cursor to default --
		const viewport = map.getViewport();
		if (viewport) {
			viewport.style.cursor = '';
		}
		//-- Clear isEditing flag from all bus stop features --
		if (busStopsSource) {
			busStopsSource.getFeatures().forEach((f: Feature) => {
				f.set('isEditing', false);
			});
		}
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
		//-- For Point type (bus stops), use the bus stop icon --
		const pointStyle = new Style({
			image: new Icon({
				src: BusstopImg,
				scale: 0.07,
				anchor: [0.5, 1]
			})
		});
		const drawOpts: any = {
			source: vectorSource,
			type: type === 'Rectangle' ? 'Circle' : type,
			style: type === 'Point' ? pointStyle : drawingStyle
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

			//-- For Point type (bus stops), clear only previous bus stop points while keeping boundaries --
			if (type === 'Point' && vectorSource && typeof vectorSource.getFeatures === 'function') {
				const features = vectorSource.getFeatures();
				for (const f of features) {
					if (f.get && f.get('isBusStopPoint')) {
						FeatureUtils.removeFeatureFromSource(f, vectorSource);
					}
				}
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

				//-- Handle Point type for bus stops --
				if (type === 'Point') {
					const coords = geom.getCoordinates();
					const lonLat = toLonLat(coords);
					const pointWkt = `POINT(${lonLat[0].toFixed(6)} ${lonLat[1].toFixed(6)})`;

					//-- Validate bus stop location (must be inside selected landmark) --
					const busStopValidation = ValidationUtils.validateBusStopLocation(
						coords,
						landmarks,
						selectedLandmarkId,
						wktFormat
					);

					if (!busStopValidation.isValid) {
						//-- Remove the invalid point feature (use setTimeout to ensure it's fully added first) --
						setTimeout(() => {
							try {
								if (vectorSource && feature) {
									vectorSource.removeFeature(feature);
								}
							} catch (e) {
								console.warn('Error removing invalid bus stop feature:', e);
							}
						}, 0);

						//-- Dispatch event to clear location in parent --
						dispatch('pointDrawCleared');

						//-- Show alert with validation message --
						toast.error(
							busStopValidation.message || 'Bus stop must be inside the selected landmark.'
						);

						return;
					}

					//-- Mark feature as bus stop point --
					FeatureUtils.setFeatureProperties(feature, {
						drawnByUser: true,
						isBusStopPoint: true
					});

					//-- Apply bus stop icon style to the placed point --
					feature.setStyle(
						new Style({
							image: new Icon({
								src: BusstopImg,
								scale: 0.07,
								anchor: [0.5, 1]
							})
						})
					);

					dispatch('pointDrawComplete', { location: pointWkt, coordinates: lonLat });
					return;
				}

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
							if (modifyEnabled) enableLandmarkModify();
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
						if (modifyEnabled) enableLandmarkModify();
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

	//-- Stop drawing --
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
		_currentDrawingType = null; //-- Reset drawing type to avoid stale state --
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

	//-- Clear all drawings and stop interactions --
	export function clearDrawings() {
		clearPreviousDrawings();
		_isDrawingActive = false;
		disableLandmarkModify();
	}

	//-- Clear only drawn features without affecting drawing/modify state --
	export function clearDrawnFeatures() {
		clearPreviousDrawings();
	}

	//-- Expose modify functions for external control (unchanged) --
	export function startModify() {
		enableLandmarkModify();
	}

	export function stopModify() {
		disableLandmarkModify();
	}

	export function toggleModify() {
		if (_isModifyEnabled) {
			disableLandmarkModify();
		} else {
			enableLandmarkModify();
		}
	}

	//-- Get drawn features as GeoJSON (unchanged) --
	export function getDrawnGeoJSON() {
		return geojsonFormat.writeFeaturesObject(vectorSource.getFeatures());
	}

	//-- Create tile source based on selected provider --
	function createSource() {
		//-- If providerUrl is empty or not provided, use built-in OSM --
		if (!providerUrl || providerUrl.trim() === '') {
			return new OSM();
		}

		//-- Use XYZ source for custom tile providers --
		return new XYZ({
			url: providerUrl,
			crossOrigin: 'anonymous',
			maxZoom: providerMaxZoom || 19,
			//-- Important: OpenLayers treats attribution strings as HTML. Escape user-controlled --
			//-- attribution values to plain text to avoid injection of HTML/JS from imported providers. --
			attributions: providerAttribution ? escapeHtml(providerAttribution) : undefined
		});
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
		createBusStopLayer();
		createSearchMarkerLayer();
		createRoutePathLayer();

		tileLayer = new TileLayer({
			source: createSource() ?? new OSM()
		});

		map = new Map({
			target: container,
			//-- Draw route path before landmarks so connecting line renders under sequence badges --
			layers: [
				tileLayer,
				routePathLayer,
				landmarksLayer,
				busStopsLayer,
				vectorLayer,
				searchMarkerLayer
			],
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

		//-- Click handler: detect landmark clicks and dispatch event --
		map.on('singleclick', (evt: any) => {
			if (!evt || !evt.coordinate) return;
			try {
				const clickCoord = evt.coordinate;
				let clickedLandmark: any = null;
				let closestDist = Infinity;

				//-- First try forEachFeatureAtPixel for standard geometries --
				map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
					if (clickedLandmark) return;
					if (layer === landmarksLayer) {
						const landmarkId = feature.get('landmarkId');
						const landmarkName = feature.get('landmarkName');
						if (landmarkId) {
							clickedLandmark = { landmarkId, landmarkName };
						}
					}
				});

				//-- Fallback: check Circle geometries by coordinate distance (forEachFeatureAtPixel
				//   does not reliably detect ol/geom/Circle features in hit-detection) --
				if (!clickedLandmark && landmarksSource) {
					const features = landmarksSource.getFeatures();
					for (const feature of features) {
						const geom = feature.getGeometry();
						if (geom && geom instanceof CircleGeom) {
							const center = geom.getCenter();
							const radius = geom.getRadius();
							const dx = clickCoord[0] - center[0];
							const dy = clickCoord[1] - center[1];
							const dist = Math.sqrt(dx * dx + dy * dy);
							if (dist <= radius && dist < closestDist) {
								const landmarkId = feature.get('landmarkId');
								const landmarkName = feature.get('landmarkName');
								if (landmarkId) {
									closestDist = dist;
									clickedLandmark = { landmarkId, landmarkName };
								}
							}
						}
					}
				}

				if (clickedLandmark) {
					dispatch('landmarkClick', clickedLandmark);
				}
			} catch (e: any) {
				handleError(e, 'landmark click handler');
			}
		});

		//-- Dispatch viewport center as WKT POINT on pan/zoom so parent can fetch nearby landmarks --
		_moveEndHandler = () => {
			try {
				const view = map.getView();
				const center = view.getCenter();
				if (!center) return;
				const [lon, lat] = toLonLat(center);
				const wktPoint = `POINT(${lon} ${lat})`;
				const zoom = view.getZoom() ?? 0;
				dispatch('viewChanged', { location: wktPoint, zoom });
			} catch (e: any) {
				handleError(e, 'moveend handler');
			}
		};
		map.on('moveend', _moveEndHandler);
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
						const currentLandmarkId = lm.id || lm._id || null;

						//-- If polygon (rectangle stored as WKT), calculate the inscribed circle --
						if (geom && geom.getType && geom.getType() === 'Polygon') {
							const extent = geom.getExtent();
							if (extent) {
								const center = getCenter(extent);
								const dx = extent[2] - extent[0];
								const dy = extent[3] - extent[1];
								//-- Calculate the circle inscribed inside the rectangle --
								//-- The circle's diameter should be the smaller side of the rectangle --
								const minSide = Math.min(dx, dy);
								const radius = minSide / 2;

								const circleFeat = new Feature(new CircleGeom(center, radius));
								//-- mark as visual circle for a backend rectangle --
								const routeEntry = routePath.find((rp) => rp.landmarkId === currentLandmarkId);
								FeatureUtils.setFeatureProperties(circleFeat, {
									isCircleForRectangle: true,
									backendRectCoords: geom.getCoordinates()[0] || [],
									landmarkId: currentLandmarkId,
									landmarkName: lm.name || '',
									isSelected: !!(selectedLandmarkId && lm.id === selectedLandmarkId),
									isRouteLandmark: !!routeEntry,
									routeSequence: routeEntry?.sequence ?? null
								});
								landmarksSource.addFeature(circleFeat);

								if (extent) extents.push(extent);
								if (selectedLandmarkId && lm.id === selectedLandmarkId)
									selectedFeature = circleFeat;
							}
						} else {
							//-- regular feature (e.g., point) --
							const routeEntry = routePath.find((rp) => rp.landmarkId === currentLandmarkId);
							FeatureUtils.setFeatureProperties(feat, {
								landmarkId: currentLandmarkId,
								landmarkName: lm.name || '',
								isSelected: !!(selectedLandmarkId && lm.id === selectedLandmarkId),
								isRouteLandmark: !!routeEntry,
								routeSequence: routeEntry?.sequence ?? null
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

						//-- Enable modify interaction for selected circle feature only when parent allows it --
						if (selectedFeature.get('isCircleForRectangle')) {
							setTimeout(() => {
								if (modifyEnabled) enableLandmarkModify();
							}, 200);
						}
					} catch (e: any) {
						handleError(e, 'focusing selected landmark');
					}
				} else if (autoFitLandmarks && extents.length > 0) {
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

	//-- Render bus stops (points) and ensure they fall within their parent landmark boundary --
	$: if (map && busStopsSource) {
		try {
			busStopsSource.clear();
			if (busStops && Array.isArray(busStops) && busStops.length > 0) {
				const wkt = new WKT();
				const viewProj = map.getView().getProjection().getCode();
				for (const bs of busStops) {
					if (!bs || !bs.location) continue;
					try {
						//-- read the point geometry and transform to view projection --
						const pointFeat = wkt.readFeature(bs.location, {
							dataProjection: 'EPSG:4326',
							featureProjection: viewProj
						});
						if (!pointFeat) continue;
						const pointGeom: any = pointFeat.getGeometry();
						let inside = false;
						let couldTestContainment = false;
						//-- find parent landmark by id and test containment --
						const lm = (landmarks || []).find(
							(l: any) =>
								(l.apiId ?? l.id ?? l._id) === bs.landmark_id ||
								String(l.apiId ?? l.id ?? l._id) === String(bs.landmark_id)
						);
						if (lm && lm.boundary && pointGeom && pointGeom.getCoordinates) {
							try {
								const poly = wkt.readGeometry(lm.boundary, {
									dataProjection: 'EPSG:4326',
									featureProjection: viewProj
								});
								if (poly && typeof poly.intersectsCoordinate === 'function') {
									inside = poly.intersectsCoordinate(pointGeom.getCoordinates());
									couldTestContainment = true;
								}
							} catch (e) {
								handleError(e, 'testing busstop containment');
							}
						}
						//-- Render bus stop if it's inside the landmark boundary. --
						//-- Only use landmark match as fallback if containment couldn't be computed (e.g., missing/invalid boundary) --
						if (inside || (lm && !couldTestContainment)) {
							FeatureUtils.setFeatureProperties(pointFeat, {
								busStopId: bs.id || bs._id || null,
								name: bs.name || '',
								landmarkId: bs.landmark_id || null
							});
							busStopsSource.addFeature(pointFeat);
						}
					} catch (e: any) {
						handleError(e, 'rendering busstop');
					}
				}
			}
		} catch (e: any) {
			handleError(e, 'rendering busstops');
		}
	}

	//-- Update tile layer when provider changes --
	$: {
		selectedProvider;
		providerUrl;
		providerAttribution;
		providerMaxZoom;

		if (map && tileLayer) {
			updateTileLayer();
		}
	}

	//-- Cleanup on destroy --
	onDestroy(() => {
		stopDrawing();
		disableLandmarkModify();
		disableBusStopModify();
		if (map && _pointerMoveHandler) {
			map.un('pointermove', _pointerMoveHandler);
			_pointerMoveHandler = null;
		}
		if (map && _moveEndHandler) {
			map.un('moveend', _moveEndHandler);
			_moveEndHandler = null;
		}
		//-- cleanup search marker --
		clearSearchMarker();
		map?.setTarget(undefined);
	});

	//-- Keep modify interaction in sync with parent-controlled flag --
	$: if (map && !modifyEnabled) {
		//-- ensure modify is disabled when parent turns it off --
		disableLandmarkModify();
	}

	//-- Enable/disable bus stop drag interaction based on editingBusStopId --
	$: if (map && busStopsSource) {
		if (editingBusStopId) {
			enableBusStopModify(editingBusStopId);
		} else {
			disableBusStopModify();
		}
	}

	//-- Render route path (connecting line only — landmark circles are handled by the landmark layer) --
	$: if (map && routePathSource) {
		try {
			routePathSource.clear();
			if (routePath && Array.isArray(routePath) && routePath.length >= 2) {
				//-- Compute center coordinates for each route landmark --
				const centers: number[][] = [];
				const wkt = new WKT();
				for (let i = 0; i < routePath.length; i++) {
					const p = routePath[i];
					if (p.boundary) {
						try {
							const feat = wkt.readFeature(p.boundary, {
								dataProjection: 'EPSG:4326',
								featureProjection: 'EPSG:3857'
							});
							if (feat) {
								const geom: any = feat.getGeometry();
								if (geom && geom.getExtent) {
									centers.push(getCenter(geom.getExtent()));
									continue;
								}
							}
						} catch (e) {
							/* fallback */
						}
					}
					centers.push(fromLonLat([p.lon, p.lat]));
				}

				//-- Add connecting line between route landmark centers --
				if (centers.length >= 2) {
					const lineFeat = new Feature(new LineString(centers));
					lineFeat.set('routeFeatureType', 'line');
					routePathSource.addFeature(lineFeat);
				}

				//-- Fit view to route extent --
				const extent = routePathSource.getExtent();
				if (extent && isFinite(extent[0])) {
					map.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 14, duration: 400 });
				}
			}
		} catch (e) {
			handleError(e, 'route path rendering');
		}
	}

	//-- Show/hide overlap squares when there's overlap during drawing --
	$: if (map && vectorSource && landmarksSource) {
		//-- Remove previous overlap squares if they exist --
		if (_drawnOverlapSquareFeature) {
			try {
				vectorSource.removeFeature(_drawnOverlapSquareFeature);
			} catch (e) {
				/* ignore */
			}
			_drawnOverlapSquareFeature = null;
		}
		if (_existingOverlapSquareFeature) {
			try {
				landmarksSource.removeFeature(_existingOverlapSquareFeature);
			} catch (e) {
				/* ignore */
			}
			_existingOverlapSquareFeature = null;
		}

		//-- Add overlap squares only if there's an overlap --
		if (overlappingLandmarkId) {
			//-- Add drawn rectangle square --
			if (drawnRectCoords && drawnRectCoords.length >= 4) {
				try {
					const drawnSquare = new Feature(new Polygon([drawnRectCoords]));
					drawnSquare.setStyle(
						new Style({
							stroke: new Stroke({ color: 'rgba(255,0,0,0.8)', width: 2, lineDash: [6, 4] }),
							fill: new Fill({ color: 'rgba(255,0,0,0.1)' })
						})
					);
					vectorSource.addFeature(drawnSquare);
					_drawnOverlapSquareFeature = drawnSquare;
				} catch (e) {
					/* ignore */
				}
			}

			//-- Add existing landmark's rectangle square --
			const overlappingLm = (landmarks || []).find(
				(lm: any) => (lm?.id || lm?._id) === overlappingLandmarkId
			);
			if (overlappingLm?.boundary) {
				try {
					const wkt = new WKT();
					const feat = wkt.readFeature(overlappingLm.boundary, {
						dataProjection: 'EPSG:4326',
						featureProjection: 'EPSG:3857'
					});
					const geom: any = feat?.getGeometry();
					if (geom?.getType?.() === 'Polygon') {
						const existingSquare = new Feature(new Polygon([geom.getCoordinates()[0]]));
						existingSquare.setStyle(
							new Style({
								stroke: new Stroke({ color: 'rgba(255,0,0,0.8)', width: 2, lineDash: [6, 4] }),
								fill: new Fill({ color: 'rgba(255,0,0,0.1)' })
							})
						);
						landmarksSource.addFeature(existingSquare);
						_existingOverlapSquareFeature = existingSquare;
					}
				} catch (e) {
					/* ignore */
				}
			}
		}
	}
</script>

<div bind:this={container} style="width:100%; height:100%;"></div>
