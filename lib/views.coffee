{$, TextEditorView, View, SelectListView} = require 'atom-space-pen-views'

class CustomListView extends SelectListView
    initialize: (@emptyMessage, @onConfirmed) ->
        super
        @storeFocusedElement()
        @panel ?= atom.workspace.addModalPanel(item: this)
        @panel.show()
        @focusFilterEditor()

    getFilterKey: ->
        'name'

    destroy: ->
        @cancel()

    viewForItem: (item) ->
        element = document.createElement('li')
        element.textContent = item.name
        element

    cancelled: ->
        @panel?.destroy()
        @panel = null

    confirmed: (item) ->
        @onConfirmed?(item)
        @cancel()

    getEmptyMessage: ->
        @emptyMessage


class TextInputView extends View
    @content: (@prompt) ->
        @div =>
            @label @prompt, class: 'icon icon-arrow-right', outlet: 'promptText'
            @subview 'miniEditor', new TextEditorView(mini: true)

    initialize: (@prompt, @default, @onConfirmed) ->
        atom.commands.add @element,
            'core:confirm': @confirm
            'core:cancel': @cancel

        @miniEditor.on 'blur', (e) =>
            @cancel() unless not document.hasFocus()

        @miniEditor.setText(@default)

    storeFocusedElement: ->
        @previouslyFocusedElement = $(document.activeElement)

    restoreFocus: ->
        @previouslyFocusedElement?.focus()

    confirm: =>
        text = @miniEditor.getText()
        @onConfirmed?(text)
        @cancel()

    cancel: =>
        @panel?.destroy()
        @panel = null
        @restoreFocus()

    attach: ->
        @storeFocusedElement()
        @panel = atom.workspace.addModalPanel(item: @element)
        @miniEditor.focus()
        @miniEditor.getModel().scrollToCursorPosition()


module.exports.CustomListView = CustomListView
module.exports.TextInputView = TextInputView
