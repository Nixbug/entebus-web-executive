<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import XYZ from 'ol/source/XYZ';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Feature from 'ol/Feature';
	import Point from 'ol/geom/Point';
	import Style from 'ol/style/Style';
	import Icon from 'ol/style/Icon';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import LocationIcon from '$lib/assets/location_icon.png';

	//-- Props --
	export let latitude: number = 10.8505;
	export let longitude: number = 76.2711;
	export let zoom: number = 8;
	export let providerUrl: string = '';
	export let providerAttribution: string = '';
	export let providerMaxZoom: number = 19;
	//-- When true, clicking the map picks a location and fires pointSelected --
	export let pickMode: boolean = false;

	const dispatch = createEventDispatcher<{ pointSelected: { lat: number; lon: number } }>();

	//-- Variables --
	let container: HTMLDivElement;
	let map: Map;
	let tileLayer: TileLayer<any>;
	let locationSource: VectorSource<any>;
	let locationLayer: VectorLayer<any>;

	//-- Escape HTML in attributions for security --
	function escapeHtml(str: string | undefined): string | undefined {
		if (!str) return undefined;
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	//-- Create tile source based on provider --
	function createSource() {
		//-- If providerUrl is empty, use built-in OSM --
		if (!providerUrl || providerUrl.trim() === '') {
			return new OSM();
		}

		//-- Use XYZ source for custom tile providers --
		return new XYZ({
			url: providerUrl,
			maxZoom: providerMaxZoom,
			attributions: providerAttribution ? escapeHtml(providerAttribution) : undefined
		});
	}

	//-- Standard pin icon style --
	function pinStyle() {
		return new Style({
			image: new Icon({
				src: LocationIcon,
				scale: 1,
				anchor: [0.5, 1],
				anchorXUnits: 'fraction',
				anchorYUnits: 'fraction'
			})
		});
	}

	//-- Create location marker layer --
	function createLocationLayer() {
		locationSource = new VectorSource({ wrapX: false });

		//-- In view mode show marker at given coords; pick mode starts with no marker --
		if (!pickMode) {
			const markerFeature = new Feature({
				geometry: new Point(fromLonLat([longitude, latitude]))
			});
			markerFeature.setStyle([pinStyle()]);
			locationSource.addFeature(markerFeature);
		}

		locationLayer = new VectorLayer({
			source: locationSource,
			zIndex: 100
		});
	}

	//-- Move or place the pick-mode marker --
	function placePickMarker(lon: number, lat: number) {
		locationSource.clear();
		const f = new Feature({ geometry: new Point(fromLonLat([lon, lat])) });
		f.setStyle([pinStyle()]);
		locationSource.addFeature(f);
	}

	//-- Update map size --
	export function updateSize() {
		map?.updateSize();
	}

	//-- Initialize map on mount --
	onMount(() => {
		createLocationLayer();

		tileLayer = new TileLayer({
			source: createSource()
		});

		map = new Map({
			target: container,
			layers: [tileLayer, locationLayer],
			view: new View({
				center: fromLonLat([longitude, latitude]),
				zoom: zoom,
				minZoom: 1,
				maxZoom: 19
			}),
			controls: []
		});

		//-- In pick mode: crosshair cursor + click-to-place marker --
		if (pickMode) {
			map.getViewport().style.cursor = 'crosshair';
			map.on('click', (evt) => {
				const [lon, lat] = toLonLat(evt.coordinate);
				placePickMarker(lon, lat);
				dispatch('pointSelected', { lat, lon });
			});
		}

		//-- Trigger size update on next tick to ensure proper rendering --
		setTimeout(() => {
			map?.updateSize();
		}, 100);
	});

	//-- Cleanup on destroy --
	onDestroy(() => {
		map?.setTarget(undefined);
	});
</script>

<div bind:this={container} style="width:100%; height:100%;"></div>
