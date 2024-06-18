/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import extractHeadings from './extractHeadings.js'

export const headingAnchorPluginKey = new PluginKey('headingAnchor')

/**
 * Heading anchor decorations ProseMirror plugin
 * Add anchor tags with a unique id to all headings.
 *
 * @return {Plugin<DecorationSet>}
 */
export default function headingAnchor() {
	return new Plugin({

		key: headingAnchorPluginKey,

		state: {
			init(_, { doc }) {
				const headings = extractHeadings(doc)
				return {
					headings,
					decorations: anchorDecorations(doc, headings),
				}
			},
			apply(tr, value, _oldState, newState) {
				if (!tr.docChanged) {
					return value
				}
				const headings = extractHeadings(newState.doc)
				// if the headings are the same, keep the decorations
				if (sameHeadings(headings, value.headings)) {
					return {
						headings,
						decorations: value.decorations.map(tr.mapping, tr.doc),
					}
				}
				return {
					headings,
					decorations: anchorDecorations(newState.doc, headings),
				}
			},
		},

		props: {
			decorations(state) {
				return this.getState(state).decorations
			},
		},
	})
}

/**
 * Check if the headings provided are equivalent.
 *
 * @param {Array} current - array of headings
 * @param {Array} other - headings to compare against
 *
 * @return {boolean}
 */
function sameHeadings(current, other) {
	if (current.length !== other.length) return false
	return current.every(isEquivalentTo(other))
}

/**
 * Check if headings are equivalent - i.e. have the same id and level
 *
 * @param {Array} other - headings to compare against
 *
 * Returns a function to be used in a call to Array#every.
 * The returned function takes a heading and an index (as provided by iterators)
 * and compares the id and level of the heading to the one in `other` with the same index.
 */
const isEquivalentTo = (other) => (heading, i) => {
	return heading.id === other[i].id
		&& heading.level === other[i].level
}

/**
 * Create anchor decorations for the given headings
 * @param {Document} doc - prosemirror doc
 * @param {Array} headings - headings structure in the doc
 * @return {DecorationSet}
 */
function anchorDecorations(doc, headings) {
	const decorations = headings.map(decorationForHeading)
	return DecorationSet.create(doc, decorations)
}

/**
 * Create a decoration for the given heading
 * @param {object} heading to decorate
 * @return {Decoration}
 */
function decorationForHeading(heading) {
	return Decoration.widget(
		heading.offset + 1,
		anchorForHeading(heading),
		{ side: -1 },
	)
}

/**
 * Create an anchor element for the given heading
 * @param {object} heading to generate anchor for
 * @return {HTMLElement}
 */
function anchorForHeading(heading) {
	const el = document.createElement('a')
	const symbol = document.createTextNode('#')
	el.appendChild(symbol)
	el.setAttribute('id', heading.id)
	el.setAttribute('aria-hidden', 'true')
	el.className = 'heading-anchor'
	el.setAttribute('href', `#${heading.id}`)
	el.setAttribute('title', window.t('text', 'Link to this section'))
	el.setAttribute('contenteditable', 'false')
	el.addEventListener('click', handleClick)
	return el
}

/**
 * Handle click on an anchor - scroll into view and change location hash.
 * @param {PointerEvent} event click that triggered the function
 */
function handleClick(event) {
	event.stopPropagation()
	event.target.scrollIntoView()
	window.location.hash = event.target.getAttribute('href')
}
