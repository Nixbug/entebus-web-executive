//-- Executive type definition --
export type Executive = {
	id: string;
	apiId: number | null;
	initials?: string;
	name: string;
	designation: string;
	gender: string;
	isYou?: boolean;
	email: string;
	phone: string;
	createdAt: string;
	[key: string]: any;
	isActive?: boolean;
	username: string;
	password: string;
};

//-- ExecutiveRole type definition --
export type ExecutiveRole = {
	id: string;
	name: string;
	apiId?: number | null;
	permissions: Record<string, any>;
	createdAt: string;
	updatedAt: string;
};

//-- Company type definition --
export type Company = {
	id: string;
	ownerName: string;
	name: string;
	address: string;
	location: string;
	email: string;
	phone: string;
	status: string;
	type: string;
	createdAt: string;
	updatedAt: string;
};

//-- Landmark type definition --
export type Landmark = {
	id: string;
	name: string;
	boundary: string;
	type: string;
	createdAt?: string;
	updatedAt?: string;
};

//-- TileProvider type definition for generic map tile providers --
export interface TileProvider {
	name: string;
	url: string;
	attribution?: string;
	maxZoom?: number;
	isBuiltIn?: boolean;
}

//-- Bus Stop type definition --
export type BusStop = {
	id: string;
	name: string;
	location: string;
	landmarkId: string;
};

//-- Fare type definition --
export type Fare = {
	id: string;
	companyId?: string;
	name: string;
	version: number;
	attributes: {
		df_version: number;
		ticket_types: Array<{ id: number; name: string }>;
		currency_type: string;
		distance_unit: string;
		extra: Record<string, any>;
	};
	function: string;
	created_on: string;
	updated_on: string;
};

//-- Operator type definition --
export type Operator = {
	id: string;
	companyId: string;
	username: string;
	password: string;
	name: string;
	email: string;
	phone: string;
	gender: string;
	createdAt: string;
	updatedAt?: string;
	isActive?: boolean;
};

//-- Vehicle type definition --
export type Vehicle = {
	id: string;
	companyId: string;
	name: string;
	capacity: number;
	registrationNumber: string;
	manufactured_on: string;
	insurance_upto?: string | null;
	fitness_upto?: string | null;
	pollution_upto?: string | null;
	road_tax_upto?: string | null;
	status: string;
	isActive?: boolean;
};

//-- OperatorRole type definition --
export type OperatorRole = {
	id: string;
	companyId: string;
	name: string;
	permissions: Record<string, any>;
	createdAt: string;
	updatedAt: string;
};

//-- Route type definition --
export type Route = {
	id: string;
	name: string;
	companyId: string;
	startingTime: string;
	status: string;
};

//-- Landmark in Route type definition --
export type LandmarkInRoute = {
	id: string;
	routeId: string;
	landmarkId: string;
	distanceFromStart: number;
	arrivalDelta: number;
	departureDelta: number;
};

//-- Route:Landmark time selection type definition --
export interface TimeSelection {
	days?: number;
	hours?: number;
	minutes?: number;
	period?: 'AM' | 'PM';
}
