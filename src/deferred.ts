export class Deferred {
    public promise: Promise<any>
    private _resolve?: (value?: any) => void
    private _reject?: (reason?: any) => void

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    public get resolve() {
        if (!this._resolve) {
            throw new Error('Deferred.resolve is undefined')
        }
        return this._resolve
    }

    public get reject() {
        if (!this._reject) {
            throw new Error('Deferred.reject is undefined')
        }
        return this._reject
    }
}
