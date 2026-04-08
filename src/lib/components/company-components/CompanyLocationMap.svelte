<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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
	import CircleStyle from 'ol/style/Circle';
	import Fill from 'ol/style/Fill';
	import Stroke from 'ol/style/Stroke';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import LocationIcon from '$lib/assets/location_icon.png';

	//-- Props --
	export let latitude: number;
	export let longitude: number;
	export let zoom: number = 15;
	export let providerUrl: string = '';
	export let providerAttribution: string = '';
	export let providerMaxZoom: number = 19;

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

	//-- Create location marker layer --
	function createLocationLayer() {
		locationSource = new VectorSource({ wrapX: false });

		//-- Create marker feature --
		const markerFeature = new Feature({
			geometry: new Point(fromLonLat([longitude, latitude]))
		});

		//-- Style for location marker --
		const markerStyle = new Style({
			image: new Icon({
				src: LocationIcon,
				scale: 1,
				anchor: [0.5, 1],
				anchorXUnits: 'fraction',
				anchorYUnits: 'fraction'
			})
		});

		//-- Fallback circle style if image fails to load --
		const fallbackStyle = new Style({
			image: new CircleStyle({
				radius: 8,
				fill: new Fill({ color: '#3b82f6' }),
				stroke: new Stroke({ color: '#ffffff', width: 2 })
			})
		});

		markerFeature.setStyle([markerStyle, fallbackStyle]);
		locationSource.addFeature(markerFeature);

		locationLayer = new VectorLayer({
			source: locationSource,
			zIndex: 100
		});
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
