/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Activity } from "./types";
import { Utils } from "./utils";

export class APIException extends Error {
    public status_code: number;
    public details: string;
    constructor(message: string, status_code: number, details: string) {
        super(message);
        this.name = this.constructor.name;
        this.status_code = status_code;
        this.details = details;
        Object.setPrototypeOf(this, APIException.prototype);
    }

    static async raiseException(response: Response) {
        const httpError = await response.json();
        let details = "";
        if (response.status === 422 && Array.isArray(httpError.detail)) {
            const messages = httpError.detail.map((issue: any) => {
                const location = issue.loc?.slice(1).join('.') ?? '??';
                const message = issue.msg ?? '??';
                return `${location}: ${message}`;
            });
            details = messages.join('; ');
        } else {
            details = httpError.detail;
        }
        throw new APIException("API Error", response.status, details)
    }

    static async raiseError(error: unknown, activity?: Activity) {
        let errorDetails: string;

        if (error instanceof APIException) {
            errorDetails = error.details;
        } else if (error instanceof TypeError) {
            errorDetails = `Network Error: ${error.message}`;
        } else if (error instanceof SyntaxError) {
            errorDetails = `Parsing Error: ${error.message}`;
        } else if (error instanceof Error) {
            errorDetails = `Unexpected Error: ${error.message}`;
        } else {
            errorDetails = `Unexpected Error: ${String(error)}`;
        }

        if (activity) {
            activity.error_message = errorDetails;
        }

        if (error instanceof APIException) {
            throw error;
        } else {
            throw new APIException(errorDetails, 0, errorDetails);
        }
    }
}

export class API {
    //-----------for  Create Token  -----------
    static createToken = async <I, O>(
        base_url: string,
        data: I,
        activity?: Activity
    ): Promise<O> => {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
        };

        const formData = Utils.toURLSearchParams(data as object);
        try {
            if (activity) activity.in_progress = true;
            const response = await fetch(base_url, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            if (response.ok) {
                return await response.json() as O;
            }
            await APIException.raiseException(response);
        } catch (error) {
            await APIException.raiseError(error, activity);
        } finally {
            if (activity) activity.in_progress = false;
        }
        return {} as O;
    };
    ;
}
