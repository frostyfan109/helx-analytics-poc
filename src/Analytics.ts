type Transport = 'beacon' | 'xhr' | 'image';

export interface TrackingEvent {
    // Basically a higher-level event 'type', referring to the
    // category of the event on the page (e.g. "Navigation").
    category: string,
    // Specific event 'type', or action, referring to the action
    // which triggered the event (e.g. "Clicked button", "Loaded page").
    action: string,
    // An optional, more-precise label for the action
    // (e.g. if action is "Clicked button", label could be "Knowledge graph details").
    label?: string,
    // An optional, numerical value corresponding to the event being tracked.
    value?: number
    // An optional boolean representing if an event is programatic,
    // i.e., not triggered by user interaction, for example page load, usage time, etc.
    nonInteraction?: boolean,
    // An optional string corresponding to the preferred transport mechanism to be used.
    transport?: Transport
};

export interface TrackingResponse {
    success: boolean;
}

/**
 * Decorator that awaits _setupPromise before proceeding with analytics method
 * (for use within an async function).
 * 
 * @decorator
 */
export function waitsForSetup(): Function {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
        const method = descriptor.value;
        descriptor.value = async function(...args: any[]) {
            await this._setupPromise;
            return method.apply(this, args);
        };
    }
}

export abstract class HeLxAnalyticsTracker {
    public _setupPromise: Promise<void> = null;
    constructor(setupData: Object) {
        this._setupPromise = this.setup(setupData);
    }
    /**
     * The setup method should initialize whatever tracking platform is being used
     * by the implementation so that it is ready to be used in trackEvent.
     * 
     * @async
     */
    protected abstract setup(setupData: Object): Promise<void>;

    /**
     * Tracks a specific event (e.g. visiting a page, clicking a button, etc.)
     * by sending it to the analytics platform.
     * 
     * TrackingEvent is broad and should contain data required by all trackers
     * (which has great overlap).
     * 
     * This method should choose/transform the data specifically relevant
     * to the implementation's tracking platform and relay it accordingly.
     * 
     * Note: implementation should call @waitsForSetup
     * 
     * @async
     */
    public abstract trackEvent(event: TrackingEvent): Promise<TrackingResponse>;

    /**
     * Tracks the specific route (page) which following events will be taking place.
     * Some implementations, such as Google Analytics, require route tracking in order
     * to work properly.
     * 
     * @param {string} route - Should be the relative path for the URL (e.g. "/search/foobar").
     * 
     * Note: implementation should call @waitsForSetup
     * 
     * @async
     */
    public abstract trackRoute(route: string): Promise<TrackingResponse>;

    /**
     * Perform final tracking (e.g. how long a tracker/page was used) and perform 
     * any teardown required to cease analytics collection.
     * 
     * Note: implementation should call @waitsForSetup
     * 
     * @async
     */
    public abstract teardown(): Promise<void>;
}