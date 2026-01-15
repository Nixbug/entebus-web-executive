//-- openlayers.utils.ts - Utility functions for MapOL.svelte --
import Feature from 'ol/Feature';
import { Circle as CircleGeom } from 'ol/geom';
import { toLonLat } from 'ol/proj';
import WKT from 'ol/format/WKT';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import type { Landmark } from '../types/type';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';

//-- Constants --
export const AREA_CONSTANTS = {
    MIN: 2, //-- m² --
    MAX: 5 * 1000 * 1000 //-- 5 km² --
};

export const STYLE_CONSTANTS = {
    VALID: {
        STROKE: 'rgba(16,185,129,0.95)',
        FILL: 'rgba(16,185,129,0.15)',
        COLOR: '#10b981'
    },
    INVALID: {
        STROKE: 'rgba(255,0,0,0.9)',
        FILL: 'rgba(255,0,0,0.2)',
        COLOR: '#ff0000'
    },
    DEFAULT: {
        STROKE: 'rgba(0,123,255,0.9)',
        FILL: 'rgba(0,123,255,0.2)',
        COLOR: '#007bff'
    }
};

//-- Geometry Utilities --
export class GeometryUtils {
    /**
     * Calculate rectangle from circle geometry
     */
    static circleToRectangle(circleGeom: CircleGeom): {
        center: number[];
        radius: number;
        halfSide: number;
        rectCoords: number[][];
        side: number;
        area: number;
    } {
        const center = circleGeom.getCenter();
        const radius = circleGeom.getRadius();
        const halfSide = radius * Math.SQRT1_2;
        const side = 2 * halfSide;
        const area = side * side;

        //-- Rectangle coordinates (inscribed square) --
        const rectCoords = [
            [center[0] - halfSide, center[1] - halfSide],
            [center[0] + halfSide, center[1] - halfSide],
            [center[0] + halfSide, center[1] + halfSide],
            [center[0] - halfSide, center[1] + halfSide],
            [center[0] - halfSide, center[1] - halfSide]
        ];

        return { center, radius, halfSide, rectCoords, side, area };
    }

    /**
     * Convert rectangle coordinates to WKT
     */
    static rectCoordsToWKT(rectCoords: number[][]): string {
        const lonlatCoords = rectCoords.map((c: number[]) => {
            const ll = toLonLat(c);
            return `${ll[0]} ${ll[1]}`;
        });

        return `POLYGON((${lonlatCoords.join(',')}))`;
    }

    /**
     * Calculate extent from circle for rectangle
     */
    static getRectangleExtentFromCircle(circleGeom: CircleGeom): number[] {
        const { center, halfSide } = this.circleToRectangle(circleGeom);
        return [
            center[0] - halfSide,
            center[1] - halfSide,
            center[0] + halfSide,
            center[1] + halfSide
        ];
    }

    /**
     * Calculate polygon extent
     */
    static getPolygonExtent(polygon: Geometry | undefined): number[] | undefined {
        try {
            return polygon?.getExtent();
        } catch (e) {
            console.warn('Error getting polygon extent:', e);
            return undefined;
        }
    }
}

//-- Validation Utilities --
export class ValidationUtils {
    /**
     * Validate area against limits
     */
    static validateArea(area: number): { isValid: boolean; message?: string } {
        if (area > AREA_CONSTANTS.MAX) {
            return {
                isValid: false,
                message: 'Boundary exceeds maximum allowed area (5 km²).'
            };
        }

        if (area < AREA_CONSTANTS.MIN) {
            return {
                isValid: false,
                message: 'Boundary area is too small (minimum 2 m²).'
            };
        }

        return { isValid: true };
    }

    /**
     * Check overlap with existing landmarks
     */
    static checkOverlap(
        drawnExtent: number[],
        landmarks: Landmark[] | undefined,
        excludeLandmarkId: string | null = null,
        wktFormat: WKT
    ): { hasOverlap: boolean; overlappingLandmarkName?: string } {
        if (!landmarks || !Array.isArray(landmarks)) {
            return { hasOverlap: false };
        }

        for (const lm of landmarks) {
            //-- Skip excluded landmark (when modifying existing) --
            if (excludeLandmarkId && lm.id === excludeLandmarkId) {
                continue;
            }

            if (!lm || !lm.boundary) continue;

            try {
                const feat = wktFormat.readFeature(lm.boundary, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                const lgeom = feat.getGeometry();

                if (!lgeom || typeof lgeom.intersectsExtent !== 'function') {
                    continue;
                }

                if (lgeom.intersectsExtent(drawnExtent)) {
                    const existingExtent = lgeom.getExtent();

                    //-- Check if extents actually overlap (not just touch) --
                    const overlap = !(
                        drawnExtent[2] < existingExtent[0] ||
                        drawnExtent[0] > existingExtent[2] ||
                        drawnExtent[3] < existingExtent[1] ||
                        drawnExtent[1] > existingExtent[3]
                    );

                    if (overlap) {
                        return {
                            hasOverlap: true,
                            overlappingLandmarkName: lm.name || lm.id || 'Unknown landmark'
                        };
                    }
                }
            } catch (e) {
                console.warn('Error checking overlap:', e);
            }
        }

        return { hasOverlap: false };
    }

    /**
     * Comprehensive drawing validation
     */
    static validateDrawing(
        geometry: any,
        drawingType: 'Point' | 'LineString' | 'Polygon' | 'Rectangle',
        landmarks: Landmark[] | undefined,
        excludeLandmarkId: string | null = null,
        wktFormat: WKT
    ): {
        isValid: boolean;
        area?: number;
        message?: string;
        extent?: number[];
    } {
        let area = 0;
        let extent: number[] | undefined = undefined;

        try {
            //-- Calculate area and extent based on geometry type --
            if (drawingType === 'Rectangle' && geometry.getType() === 'Circle') {
                const rectInfo = GeometryUtils.circleToRectangle(geometry);
                area = rectInfo.area;
                extent = GeometryUtils.getRectangleExtentFromCircle(geometry);
            } else if (geometry.getType() === 'Polygon') {
                area = geometry.getArea ? geometry.getArea() : 0;
                extent = GeometryUtils.getPolygonExtent(geometry);
            } else {
                area = geometry.getArea ? geometry.getArea() : 0;
                extent = GeometryUtils.getPolygonExtent(geometry);
            }

            //-- Validate area --
            const areaValidation = this.validateArea(area);
            if (!areaValidation.isValid) {
                return {
                    isValid: false,
                    area,
                    message: areaValidation.message
                };
            }

            //-- Check overlap if we have extent --
            if (extent && landmarks) {
                const overlapCheck = this.checkOverlap(
                    extent,
                    landmarks,
                    excludeLandmarkId,
                    wktFormat
                );

                if (overlapCheck.hasOverlap) {
                    return {
                        isValid: false,
                        area,
                        message: `Boundary overlaps with an existing landmark (${overlapCheck.overlappingLandmarkName}).`,
                        extent
                    };
                }
            }

            return { isValid: true, area, extent };
        } catch (error) {
            console.warn('Validation error:', error);
            return { isValid: false, message: 'Validation error occurred' };
        }
    }
}

//-- Style Utilities  --
export class StyleUtils {
    /**
     * Create a style object
     */
    static createStyle(
        type: 'valid' | 'invalid' | 'default' | 'selected' = 'default',
        options: {
            strokeWidth?: number;
            circleRadius?: number;
        } = {}
    ): Style {
        const config = this.getStyleConfig(type);
        const strokeWidth = options.strokeWidth || (type === 'selected' ? 3 : 2);
        const circleRadius = options.circleRadius || (type === 'selected' ? 8 : 6);

        return new Style({
            stroke: new Stroke({
                color: config.STROKE,
                width: strokeWidth
            }),
            fill: new Fill({
                color: config.FILL
            }),
            image: new CircleStyle({
                radius: circleRadius,
                fill: new Fill({ color: config.COLOR })
            })
        });
    }

    /**
     * Get style configuration
     */
    private static getStyleConfig(type: string) {
        switch (type) {
            case 'valid':
                return STYLE_CONSTANTS.VALID;
            case 'invalid':
                return STYLE_CONSTANTS.INVALID;
            case 'selected':
                return STYLE_CONSTANTS.VALID; //-- Selected uses valid style (green) --
            default:
                return STYLE_CONSTANTS.DEFAULT;
        }
    }

    /**
     * Create drawing style (green theme)
     */
    static createDrawingStyle(): Style {
        return this.createStyle('valid', { strokeWidth: 2, circleRadius: 6 });
    }

    /**
     * Create invalid style (red theme)
     */
    static createInvalidStyle(): Style {
        return this.createStyle('invalid', { strokeWidth: 2, circleRadius: 6 });
    }

    /**
     * Create selected style (thicker green)
     */
    static createSelectedStyle(): Style {
        return this.createStyle('selected', { strokeWidth: 3, circleRadius: 8 });
    }
}

//-- Feature Utilities --
export class FeatureUtils {
    /**
     * Set feature properties safely
     */
    static setFeatureProperties(feature: Feature | null, properties: Record<string, unknown>): void {
        if (!feature) return;

        Object.keys(properties).forEach(key => {
            feature.set(key, properties[key as keyof typeof properties]);
        });
    }

    /**
     * Safely remove feature from source
     */
    static removeFeatureFromSource(feature: Feature | null, source: VectorSource<Feature<Geometry>> | { removeFeature?: (feature: Feature) => void } | null): void {
        if (!feature || !source || typeof (source as any).removeFeature !== 'function') return;

        try {
            (source as any).removeFeature(feature);
        } catch (e) {
            console.warn('Error removing feature:', e);
        }
    }

    /**
     * Clean up geometry change handler
     */
    static cleanupGeometryHandler(feature: Feature | null): void {
        if (!feature) return;

        try {
            const handler: unknown = feature.get?.('modifyChangeHandler');
            const geom: Geometry | undefined = feature.getGeometry?.();

            if (geom && (geom as any).un && handler && typeof handler === 'function') {
                (geom as any).un('change', handler as any);
            }

            feature.set?.('modifyChangeHandler', null);
        } catch (e) {
            console.warn('Error cleaning up geometry handler:', e);
        }
    }

    /**
     * Update backend rectangle from circle feature
     */
    static updateBackendRectangle(
        feature: Feature,
        landmarks: Landmark[] | undefined,
        wktFormat: WKT,
        dispatch: (event: string, detail?: unknown) => void
    ): boolean {
        try {
            const geometry = feature.getGeometry();
            if (!geometry || geometry.getType() !== 'Circle') {
                return false;
            }

            const rectInfo = GeometryUtils.circleToRectangle(geometry as CircleGeom);

            //-- Validate the drawing --
            const validation = ValidationUtils.validateDrawing(
                geometry,
                'Rectangle',
                landmarks,
                feature.get('landmarkId'),
                wktFormat
            );

            if (!validation.isValid) {
                //-- Show alert if window exists --
                if (typeof window !== 'undefined' && window.alert && validation.message) {
                    window.alert(validation.message);
                }

                //-- Dispatch error event --
                if (validation.message) {
                    dispatch?.('drawError', { message: validation.message });
                }

                //-- Mark feature as invalid --
                FeatureUtils.setFeatureProperties(feature, {
                    drawnByUser: true,
                    isInvalid: true,
                    backendRectCoords: rectInfo.rectCoords,
                    circleRadius: rectInfo.radius,
                    circleCenter: rectInfo.center
                });

                //-- Apply invalid style --
                feature.setStyle?.(StyleUtils.createInvalidStyle());
                return false;
            }

            //-- Convert to WKT --
            const boundaryWkt = GeometryUtils.rectCoordsToWKT(rectInfo.rectCoords);

            //-- Update feature properties --
            FeatureUtils.setFeatureProperties(feature, {
                backendRectCoords: rectInfo.rectCoords,
                circleRadius: rectInfo.radius,
                circleCenter: rectInfo.center,
                isInvalid: false
            });

            //-- Dispatch success --
            dispatch?.('drawComplete', {
                area: rectInfo.area,
                boundary: boundaryWkt
            });

            return true;
        } catch (error) {
            console.warn('Error updating backend rectangle:', error);
            return false;
        }
    }
}

//-- Interaction Utilities --
export class InteractionUtils {
    /**
     * Create live validation handler for modify interaction
     */
    static createModifyChangeHandler(
        feature: Feature,
        landmarks: Landmark[] | undefined,
        drawingType: 'Rectangle' | string,
        dispatch: (event: string, detail?: unknown) => void,
        wktFormat: WKT
    ): () => void {
        return () => {
            try {
                const geometry = feature.getGeometry();
                if (!geometry) return;

                const validation = ValidationUtils.validateDrawing(
                    geometry,
                    drawingType === 'Rectangle' ? 'Rectangle' : 'Polygon',
                    landmarks,
                    feature.get('landmarkId'),
                    wktFormat
                );

                //-- Update style based on validation --
                if (feature.setStyle) {
                    if (!validation.isValid) {
                        feature.setStyle(StyleUtils.createInvalidStyle());
                    } else {
                        feature.setStyle(undefined); //-- Reset to default --
                    }
                }

                //-- Dispatch area update --
                if (validation.area !== undefined) {
                    dispatch('drawArea', {
                        area: validation.area,
                        isValid: validation.isValid
                    });
                }
            } catch (error) {
                console.warn('Error in modify change handler:', error);
            }
        };
    }

    /**
     * Setup geometry change handler for drawing
     */
    static setupGeometryChangeHandler(
        feature: Feature,
        drawingType: 'Point' | 'LineString' | 'Polygon' | 'Rectangle',
        landmarks: Landmark[] | undefined,
        dispatch: (event: string, detail?: unknown) => void,
        wktFormat: WKT
    ): () => void {
        const handler = () => {
            try {
                const geometry = feature.getGeometry();
                if (!geometry) return;

                const validation = ValidationUtils.validateDrawing(
                    geometry,
                    drawingType,
                    landmarks,
                    null,
                    wktFormat
                );

                //-- Update style --
                if (feature.setStyle) {
                    if (!validation.isValid) {
                        feature.setStyle(StyleUtils.createInvalidStyle());
                    } else {
                        feature.setStyle(StyleUtils.createDrawingStyle());
                    }
                }

                //-- Dispatch area update --
                if (validation.area !== undefined) {
                    dispatch('drawArea', {
                        area: validation.area,
                        isValid: validation.isValid
                    });
                }
            } catch (error) {
                console.warn('Error in geometry change handler:', error);
            }
        };

        //-- Attach the handler --
        const geometry = feature.getGeometry();
        if (geometry?.on) {
            geometry.on('change', handler);
        }

        return handler;
    }
}
