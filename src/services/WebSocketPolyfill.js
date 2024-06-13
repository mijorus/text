/*
 * @copyright Copyright (c) 2022 Max <max@nextcloud.com>
 *
 * @author Max <max@nextcloud.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { logger } from '../helpers/logger.js'
import { encodeArrayBuffer, decodeArrayBuffer } from '../helpers/base64.ts'
import getNotifyBus from './NotifyService.js'

/**
 *
 * @param {object} syncService - the sync service to build upon
 * @param {number} fileId - id of the file to open
 * @param {object} initialSession - initial session to open
 * @param {object[]} queue - queue for the outgoing steps
 */
export default function initWebSocketPolyfill(syncService, fileId, initialSession, queue) {
	return class WebSocketPolyfill {

		#url
		#session
		#version
		binaryType
		onmessage
		onerror
		onclose
		onopen
		#handlers
		#notifyPushBus

		constructor(url) {
			this.#notifyPushBus = getNotifyBus()
			this.#notifyPushBus?.on('notify_push', this.#onNotifyPush.bind(this))
			this.url = url
			logger.debug('WebSocketPolyfill#constructor', { url, fileId, initialSession })
			this.#registerHandlers({
				opened: ({ version, session }) => {
					this.#version = version
					logger.debug('opened ', { version, session })
					this.#session = session
					this.onopen?.()
				},
				loaded: ({ version, session, content }) => {
					logger.debug('loaded ', { version, session })
					this.#version = version
					this.#session = session
				},
				sync: ({ steps, version }) => {
					logger.debug('synced ', { version, steps })
					this.#version = version
					if (steps) {
						steps.forEach(s => {
							const data = decodeArrayBuffer(s.step)
							this.onmessage({ data })
						})
					}
				},
			})
			syncService.open({ fileId, initialSession })
		}

		#registerHandlers(handlers) {
			this.#handlers = handlers
			Object.entries(this.#handlers)
				.forEach(([key, value]) => syncService.on(key, value))
		}

		send(...data) {
			// Useful for debugging what steps are sent and how they were initiated
			// data.forEach(logStep)

			queue.push(...data)
			let outbox = []
			return syncService.sendSteps(() => {
				const data = {
					steps: this.#steps,
					awareness: this.#awareness,
					version: this.#version,
				}
				outbox = [...queue]
				logger.debug('sending steps ', data)
				return data
			})?.then(ret => {
				// only keep the steps that were not send yet
				queue.splice(0,
					queue.length,
					...queue.filter(s => !outbox.includes(s)),
				)
				return ret
			}, err => logger.error(err))
		}

		get #steps() {
			return queue.map(s => encodeArrayBuffer(s))
				.filter(s => s < 'AQ')
		}

		get #awareness() {
			return queue.map(s => encodeArrayBuffer(s))
				.findLast(s => s > 'AQ') || ''
		}

		async close() {
			await this.#sendRemainingSteps()
			Object.entries(this.#handlers)
				.forEach(([key, value]) => syncService.off(key, value))
			this.#handlers = []
			this.#notifyPushBus?.off('notify_push', this.#onNotifyPush.bind(this))
			syncService.close().then(() => {
				this.onclose()
			})
			logger.debug('Websocket closed')
		}

		#sendRemainingSteps() {
			if (queue.length) {
				let outbox = []
				return syncService.sendStepsNow(() => {
					const data = {
						steps: this.#steps,
						awareness: this.#awareness,
						version: this.#version,
					}
					outbox = [...queue]
					logger.debug('sending final steps ', data)
					return data
				})?.then(() => {
					// only keep the steps that were not send yet
					queue.splice(0,
						queue.length,
						...queue.filter(s => !outbox.includes(s)),
					)
				}, err => logger.error(err))
			}
		}

		#onNotifyPush({ messageType, messageBody }) {
			if (messageBody.documentId !== fileId) {
				return
			}
			messageBody.steps.forEach(step => {
				const data = decodeArrayBuffer(step)
				this.onmessage({ data })
			})
		}

	}
}
