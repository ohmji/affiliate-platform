export type BaseEvent<TType extends string, TPayload> = {
    id: string;
    ts: string;
    type: TType;
    version: number;
    data: TPayload;
};
export interface EventBusProducer {
    publish<TEvent extends BaseEvent<string, unknown>>(event: TEvent): Promise<void>;
    close?(): Promise<void>;
}
