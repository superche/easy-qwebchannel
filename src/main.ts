import { QWebChannel } from '../vendor/qwebchannel'
import { Deferred } from './deferred'

export type CallbackFunction = Function

export class EasyQWebChannel {
    private context: any = null
    private deferred = new Deferred()

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
            this.context[methodName](data)

            deferred.resolve()
        })

        return deferred.promise
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

        this.context[methodName](data)

        return deferred.promise
    }

    /**
     * @param signalName 
     * @param callback 
     * @example channel.once('nativeMethodFinished', (args: any[]) => {})
     */
    once(signalName: string, callback: CallbackFunction)  {
        this.context[signalName].connect((...args: any[]) => {
            this.context[signalName].disconnect(callback)
            callback(...args)
        })
    }
}
