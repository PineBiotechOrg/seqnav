define(["dojo/_base/declare", "dojo/_base/lang",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojo/text!./templates/MessageDialog.html"],
(declare, lang,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 template) ->

  MessageDialog = declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin],
    templateString: template

    postCreate: () ->
      @inherited arguments
      @okButton.on "click", @dialog.hide.bind(@dialog)

    show: (opts, message) ->
      if (lang.isString(opts))
        message = opts
        opts = {title: "Error"}
      else if (opts instanceof Error)
        message = opts.message
        opts = {title: "Error"}

      @messageSpan.innerHTML = message
      @dialog.set "title", opts.title
      @dialog.show()
  )

  messageDialog = undefined

  show: (opts, message) ->
    messageDialog = new MessageDialog() unless messageDialog?
    messageDialog.show opts, message
)
