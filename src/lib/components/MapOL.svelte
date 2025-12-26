<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import 'ol/ol.css';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import { fromLonLat } from 'ol/proj';
	import { Draw } from 'ol/interaction';
	import GeoJSON from 'ol/format/GeoJSON';
	import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';

	const dispatch = createEventDispatcher();

	export let center = { lat: 10.8505, lng: 76.2711 };
	export let zoom = 13;
	export let enableDraw = false;

	let container: HTMLDivElement;
	let map: any;
	let draw: any;
	let vectorSource: any;
	let vectorLayer: any;

	export function flyTo(lat: number, lng: number, z = 14) {
		if (!map) return;
		map.getView().animate({ center: fromLonLat([lng, lat]), zoom: z, duration: 600 });
	}

	// call when container size changes (e.g. entering fullscreen)
	export function updateSize() {
		try {
			if (map && typeof map.updateSize === 'function') map.updateSize();
		} catch (e) {
			// ignore
		}
	}

	onMount(() => {
		vectorSource = new VectorSource();
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: new Style({
				fill: new Fill({ color: 'rgba(0,179,164,0.12)' }),
				stroke: new Stroke({ color: '#00a0c6', width: 2 }),
				image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#00a0c6' }) })
			})
		});

		map = new Map({
			target: container,
			layers: [new TileLayer({ source: new OSM() }), vectorLayer],
			view: new View({ center: fromLonLat([center.lng, center.lat]), zoom }),
			controls: []
		});

		if (enableDraw) {
			draw = new Draw({ source: vectorSource, type: 'Polygon' });
			map.addInteraction(draw);
			draw.on('drawend', (evt: any) => {
				const format = new GeoJSON();
				const geojson = format.writeFeatureObject(evt.feature, {
					dataProjection: 'EPSG:4326',
					featureProjection: map.getView().getProjection()
				});
				dispatch('drawend', geojson);
			});
		}

		return () => {
			if (map) map.setTarget(undefined);
		};
	});

	onDestroy(() => {
		if (map) map.setTarget(undefined);
	});
</script>

<div bind:this={container} class="map-ol" style="height:100%; width:100%;"></div>

<style>
	.map-ol {
		border-radius: 0.75rem;
		overflow: hidden;
	}
</style>
