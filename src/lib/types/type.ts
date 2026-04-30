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
	apiId?: number | null;
	name: string;
	address: string;
	location: string;
	description: string;
	status: string;
	type: string;
	createdAt: string;
	updatedAt: string;
};

//-- Landmark type definition --
export type Landmark = {
	id: string;
	apiId?: number | null;
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
	apiId?: number | null;
	companyId?: string;
	name: string;
	version: number;
	scope?: number | string;
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
	apiId?: number | null;
	username: string;
	password: string;
	name: string;
	description: string;
	initials?: string;
	email: string;
	phone: string;
	gender: string;
	status: string;
	type: string;
	createdAt: string;
	updatedAt?: string;
	isActive?: boolean;
	rolesDisplay?: string;
	roleId?: string;
	roleMapId?: number | null;
};

//-- Vehicle type definition --
export type Vehicle = {
	id: string;
	apiId?: number | null;
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
	createdAt: string;
	updatedAt?: string;
};

//-- OperatorRole type definition --
export type OperatorRole = {
	id: string;
	apiId?: number | null;
	companyId: string;
	name: string;
	permissions: Record<string, any>;
	createdAt: string;
	updatedAt: string;
};

//-- Route type definition --
export type Route = {
	id: string;
	apiId?: number | null;
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

//-- Service type definition --
export interface Service {
	id: string;
	apiId?: number | null;
	companyId: string;
	name: string;
	status: string;
	type: string;
	createdAt: string;
	updatedAt?: string;
}

//-- ServiceDetail type definition --
//-- A single stop within a ServiceDetail's route array --
export type ServiceRouteStop = {
	serviceId: number;
	landmarkId: number;
	arrivalAt: string;
	departureAt: string;
	distanceFromStart: number;
};

//-- The embedded fare object returned inside ServiceDetail --
export type ServiceFare = {
	fareId: number;
	id: number;
	name: string;
	version: number;
	function: string;
	attributes: {
		df_version: number;
		ticket_types: Array<{ id: number; name: string }>;
		currency_type: string;
		distance_unit: string;
		extra: Record<string, any>;
	};
};

//-- The embedded vehicle object returned inside ServiceDetail --
export type ServiceVehicle = {
	id: number;
	vehicleId: number;
	version: number;
	registrationNumber: string;
	name: string;
	capacity?: number;
};

//-- The full ServiceDetail type --
export type ServiceDetail = {
	id: number;
	companyId: number;
	name: string;
	status: number;
	ticketMode: number;
	registrationNumber: string;
	remark: string | null;
	startingAt: string;
	endingAt: string;
	startingLandmarkId: number;
	endingLandmarkId: number;
	createdOn: string;
	updatedOn: string | null;
	route: ServiceRouteStop[];
	fare: ServiceFare;
	vehicle: ServiceVehicle;
};

//-- Landmark lookup map used in the detail page (apiId → Landmark) --
export type LandmarkMap = Record<number, Landmark>;
