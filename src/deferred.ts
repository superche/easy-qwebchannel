export class Deferred {
    public promise: Promise<any>
    private _resolve?: (value?: any) => void
    private _reject?: (reason?: any) => void
    private _state: 'pending' | 'fulfilled' | 'rejected' = 'pending'

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    public resolve(...args: any[]) {
        if (!this._resolve) {
            throw new Error('Deferred.resolve is undefined')
        }
        this._state = 'fulfilled'
        return this._resolve(...args)
    }

    public reject(...args: any[]) {
        if (!this._reject) {
            throw new Error('Deferred.reject is undefined')
        }
        this._state = 'rejected'
        return this._reject(...args)
    }

    public get isFulfilled() {
        return this._state === 'fulfilled'
    }

    public get isRejected() {
        return this._state === 'rejected'
    }
}
