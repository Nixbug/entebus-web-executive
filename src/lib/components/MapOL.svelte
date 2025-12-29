<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import XYZ from 'ol/source/XYZ';
	import { fromLonLat } from 'ol/proj';
	import 'ol/ol.css';

	export let center = { lat: 10.8505, lng: 76.2711 };
	export let zoom = 13;
	export let tileType: 'standard' | 'google' = 'standard';
	export let googleTileUrl = '';

	let container: HTMLDivElement;
	let map: Map;
	let tileLayer: TileLayer<any>;

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

	function createSource() {
		if (tileType === 'google') {
			if (!googleTileUrl) return null;
			return new XYZ({
				url: googleTileUrl,
				crossOrigin: 'anonymous',
				maxZoom: 22
			});
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
		tileLayer = new TileLayer({
			source: createSource() ?? new OSM()
		});

		map = new Map({
			target: container,
			layers: [tileLayer],
			view: new View({
				center: fromLonLat([center.lng, center.lat]),
				zoom
			}),
			controls: []
		});
	});

	// React ONLY when relevant values change
	$: if (map && tileLayer && tileType !== 'google') {
		updateTileLayer();
	}

	$: if (map && tileLayer && tileType === 'google' && googleTileUrl) {
		updateTileLayer();
	}

	onDestroy(() => {
		map?.setTarget(undefined);
	});
</script>

<div bind:this={container} style="width:100%; height:100%;"></div>
