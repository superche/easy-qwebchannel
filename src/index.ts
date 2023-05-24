import { QWebChannel } from './vendor/qwebchannel.js'
import { Deferred } from './deferred'

export type CallbackFunction = (...args: any[]) => any

export class EasyQWebChannel {
    private context: any = null
    private deferred = new Deferred()
    private onceConnectedSignalName: { [key: string]: Deferred[] } = {}

    /**
     * @param channelObjectName 
     * @example new EasyQWebChannel('fooObj')
     */
    constructor(channelObjectName: string) {
        new QWebChannel((window as any).qt.webChannelTransport, (channel: any) => {
            this.context = channel.objects[channelObjectName]
            this.deferred.resolve()
        })
    }

    ready() {
        return this.deferred.promise
    }

    /**
     * @param signalName
     * @param methodName
     * @param callback
     * @returns Promise<void>
     * @example channel.answerNative(
     *  'signalName',
     *  'jsFinished',
     *  (args: any[]) => ({ jsSideResult: 'test' })
     * )
     */
    answerNative(signalName: string, methodName: string, callback: CallbackFunction) {
        const deferred = new Deferred()

        this.once(signalName, async (...args: any[]) => {
            const data = await callback(args)
            typeof data === 'undefined' ? this.context[methodName]() : this.context[methodName](data)

            deferred.resolve()
        })

        return deferred.promise
    }

    /**
     * @param signalName 
     * @param methodName 
     * @param callback 
     * @param skipCallMethodWhenVoid if callback returns void, skip calling methodName
     */
    answerNativeHeartBeat(signalName: string, methodName: string, callback: CallbackFunction, skipCallMethodWhenVoid = false) {
        this.context[signalName].connect(async (...args: any[]) => {
            const data = await callback(args)
            if (typeof data === 'undefined') {
                if (!skipCallMethodWhenVoid) {
                    this.context[methodName]()
                }
            } else {
                this.context[methodName](data)
            }
        })
    }

    /**
     * @param methodName 
     * @param signalName 
     * @param data 
     * @returns Promise<any>
     * @example channel.callNative(
     *  'methodName',
     *  'nativeMethodFinished',
     *  { methodArgument: 'test' },
     * )
     */
    callNative(methodName: string, signalName: string, data: any) {
        const deferred = new Deferred()

        this.once(signalName, (...args: any[]) => {
            deferred.resolve(args)
        })

        typeof data === 'undefined' ? this.context[methodName]() : this.context[methodName](data)

        return deferred.promise
    }

    /**
     * @param methodName 
     * @param data 
     */
    callNativeWithoutResponse(methodName: string, data: any) {
        typeof data === 'undefined' ? this.context[methodName]() : this.context[methodName](data)
    }

    /**
     * @param signalName 
     * @param callback 
     * @example channel.once('nativeMethodFinished', (args: any[]) => {})
     */
    async once(signalName: string, callback: CallbackFunction)  {
        const connectCallback = (...args: any[]) => {
            const jobs = this.onceConnectedSignalName[signalName]
            jobs.forEach(job => {
                if (job.isFulfilled || job.isRejected) {
                    return
                }
                job.resolve(args)
            })
        }

        if (!this.onceConnectedSignalName[signalName]) {
            // connect only once
            this.onceConnectedSignalName[signalName] = []
            this.context[signalName].connect(connectCallback)
        }

        const currentJob = new Deferred()
        this.onceConnectedSignalName[signalName].push(currentJob)

        const args = await currentJob.promise
        callback(...args)
    }
}
