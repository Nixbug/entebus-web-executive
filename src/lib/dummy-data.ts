import type { Landmark, Route, LandmarkInRoute } from './types/type';

//-- Dummy data: List of landmarks --
export const landmarks: Landmark[] = [
	{
		id: 'LAN-001',
		name: 'Varakala',
		type: 'Local',
		boundary:
			'POLYGON((76.72452503384679 8.735224445138792,76.72697120846837 8.735224445138792,76.72697120846837 8.733018725672231,76.72452503384679 8.733018725672231,76.72452503384679 8.735224445138792))'
	},
	{
		id: 'LAN-002',
		name: 'Kallambalam',
		type: 'Local',
		boundary:
			'POLYGON((76.79130706441629 8.763134311471646,76.79172548902261 8.763134311471646,76.79172548902261 8.762572320554437,76.79130706441629 8.762572320554437,76.79130706441629 8.763134311471646))'
	},
	{
		id: 'LAN-003',
		name: 'Alamcode',
		type: 'Village',
		boundary:
			'POLYGON((76.81271932279982 8.721181464249122,76.81295803940215 8.721181464249122,76.81295803940215 8.721018415595164,76.81271932279982 8.721018415595164,76.81271932279982 8.721181464249122))'
	},
	{
		id: 'LAN-004',
		name: 'Attingal',
		type: 'District',
		boundary:
			'POLYGON((76.81343298675799 8.698649239650083,76.81399625065112 8.698649239650083,76.81399625065112 8.698113665197885,76.81343298675799 8.698113665197885,76.81343298675799 8.698649239650083))'
	},
	{
		id: 'LAN-005',
		name: 'Chirayinkeezhu',
		type: 'District',
		boundary:
			'POLYGON((76.78718052809228 8.655842020222341,76.78997002546777 8.655842020222341,76.78997002546777 8.653338845698373,76.78718052809228 8.653338845698373,76.78718052809228 8.655842020222341))'
	},
	{
		id: 'LAN-006',
		name: 'Mangalapuram',
		type: 'Local',
		boundary:
			'POLYGON((76.84840143820264 8.624378767093209,76.84912027021863 8.624378767093209,76.84912027021863 8.623752922804863,76.84840143820264 8.623752922804863,76.84840143820264 8.624378767093209))'
	},
	{
		id: 'LAN-007',
		name: 'Edappally Toll Zone',
		type: 'District',
		boundary:
			'POLYGON((76.3050 10.0200,76.3200 10.0200,76.3200 10.0350,76.3050 10.0350,76.3050 10.0200))'
	},
	{
		id: 'LAN-008',
		name: 'Thrissur Round Area',
		type: 'Local',
		boundary:
			'POLYGON((76.2100 10.5150,76.2250 10.5150,76.2250 10.5300,76.2100 10.5300,76.2100 10.5150))'
	},
	{
		id: 'LAN-009',
		name: 'Guruvayur Temple Zone',
		type: 'State',
		boundary:
			'POLYGON((76.0400 10.5900,76.0550 10.5900,76.0550 10.6050,76.0400 10.6050,76.0400 10.5900))'
	},
	{
		id: 'LAN-010',
		name: 'Kozhikode Beach Road',
		type: 'State',
		boundary:
			'POLYGON((75.7600 11.2450,75.7750 11.2450,75.7750 11.2600,75.7600 11.2600,75.7600 11.2450))'
	}
];

//-- Dummy data: List of routes --
export const routes: Route[] = [
	{
		id: 'ROUTE-001',
		companyId: 'COMP-001',
		name: 'Varkala - Mangalapuram',
		startingTime: '10.00 AM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-002',
		companyId: 'COMP-001',
		name: 'Technopark - Attingal',
		startingTime: '11.00 AM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-003',
		companyId: 'COMP-001',
		name: 'Thiruvananthapuram - Varkala',
		startingTime: '12.00 PM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-004',
		companyId: 'COMP-001',
		name: 'Kochi - Aluva',
		startingTime: '01.00 PM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-005',
		companyId: 'COMP-001',
		name: 'Ernakulam - Kakkanad',
		startingTime: '02.00 PM',
		status: 'VALID'
	},
	{
		id: 'ROUTE-006',
		companyId: 'COMP-001',
		name: 'Kollam - Karunagappally',
		startingTime: '03.00 PM',
		status: 'INVALID'
	}
];

//-- Dummy data: List of landmark in routes --
export const landmarksInRoutes: LandmarkInRoute[] = [
	{
		id: 'LIR-001',
		landmarkId: 'LAN-001',
		routeId: 'ROUTE-001',
		distanceFromStart: 0,
		arrivalDelta: 0,
		departureDelta: 0
	},
	{
		id: 'LIR-002',
		landmarkId: 'LAN-002',
		routeId: 'ROUTE-001',
		distanceFromStart: 1000,
		arrivalDelta: 600,
		departureDelta: 660
	},
	{
		id: 'LIR-003',
		landmarkId: 'LAN-003',
		routeId: 'ROUTE-001',
		distanceFromStart: 2000,
		arrivalDelta: 1200,
		departureDelta: 1260
	},
	{
		id: 'LIR-004',
		landmarkId: 'LAN-004',
		routeId: 'ROUTE-001',
		distanceFromStart: 3000,
		arrivalDelta: 1800,
		departureDelta: 1860
	},
	{
		id: 'LIR-005',
		landmarkId: 'LAN-005',
		routeId: 'ROUTE-001',
		distanceFromStart: 4000,
		arrivalDelta: 2400,
		departureDelta: 2460
	},
	{
		id: 'LIR-006',
		landmarkId: 'LAN-006',
		routeId: 'ROUTE-001',
		distanceFromStart: 5000,
		arrivalDelta: 59600,
		departureDelta: 59600
	}
];
