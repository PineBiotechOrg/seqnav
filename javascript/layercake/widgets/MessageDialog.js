/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojo/text!./templates/MessageDialog.html"],
function(declare, lang,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 template) {

  const MessageDialog = declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    postCreate() {
      this.inherited(arguments);
      return this.okButton.on("click", this.dialog.hide.bind(this.dialog));
    },

    show(opts, message) {
      if (lang.isString(opts)) {
        message = opts;
        opts = {title: "Error"};
      } else if (opts instanceof Error) {
        ({ message } = opts);
        opts = {title: "Error"};
      }

      this.messageSpan.innerHTML = message;
      this.dialog.set("title", opts.title);
      return this.dialog.show();
    }
  }
  );

  let messageDialog = undefined;

  return {
    show(opts, message) {
      if (messageDialog == null) { messageDialog = new MessageDialog(); }
      return messageDialog.show(opts, message);
    }
  };
});
