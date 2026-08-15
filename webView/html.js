const editorHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />

  <style>
    :root {
      --editor-background: #ffffff;
      --editor-color: #111111;
      --editor-placeholder: #9a9a9a;
      --editor-link: #2563eb;
      --editor-selection: rgba(37, 99, 235, 0.2);
      --editor-padding: 16px;
      --editor-font-size: 16px;
      --editor-line-height: 1.5;
      --editor-font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background: var(--editor-background);
      color: var(--editor-color);
    }

    html {
      height: 100%;
    }

    body {
      min-height: 100%;
      overflow-wrap: anywhere;
    }

    #editor {
      width: 100%;
      min-height: 100vh;
      padding: var(--editor-padding);

      outline: none;
      border: none;

      font-family: var(--editor-font-family);
      font-size: var(--editor-font-size);
      line-height: var(--editor-line-height);

      caret-color: var(--editor-color);
      white-space: pre-wrap;
      word-break: break-word;
    }

    #editor:focus {
      outline: none;
    }

    #editor:empty::before {
      content: attr(data-placeholder);
      color: var(--editor-placeholder);
      pointer-events: none;
    }

    #editor a {
      color: var(--editor-link);
      text-decoration: underline;
    }

    #editor img {
      max-width: 100%;
      height: auto;
    }

    #editor blockquote {
      margin: 0.75em 0;
      padding: 0.25em 0 0.25em 1em;
      border-left: 3px solid currentColor;
      opacity: 0.85;
    }

    #editor pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      padding: 12px;
      border-radius: 6px;
      background: rgba(127, 127, 127, 0.12);
    }

    #editor code {
      font-family:
        "SFMono-Regular",
        Consolas,
        "Liberation Mono",
        Menlo,
        monospace;
    }

    #editor hr {
      border: 0;
      border-top: 1px solid rgba(127, 127, 127, 0.35);
      margin: 1em 0;
    }

    ::selection {
      background: var(--editor-selection);
    }

    /* -----------------------------------------------------------
       CHECKLISTS
    ----------------------------------------------------------- */

    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 4px 0;
      min-height: 1.5em;
    }

    .checklist-item input[type="checkbox"] {
      margin-top: 0.3em;
      flex-shrink: 0;
    }

    .checklist-content {
      flex: 1;
      min-width: 0;
      outline: none;
    }

    .checklist-item.checked .checklist-content {
      text-decoration: line-through;
      opacity: 0.6;
    }
  </style>
</head>

<body>
  <div
    id="editor"
    contenteditable="true"
    spellcheck="true"
    autocorrect="on"
    autocomplete="on"
    data-placeholder=""
  ></div>

  <script>
    (function () {
      "use strict";

      var editor = document.getElementById("editor");

      var VERSION = "2.0.0";

      var savedRange = null;
      var changeTimer = null;
      var stateTimer = null;

      var config = {
        emitChanges: true,
        changeDebounce: 100,
        emitSelectionState: true,
        sanitizeHTML: true
      };

      /* =========================================================
         REACT NATIVE BRIDGE
      ========================================================= */

      function post(type, payload, requestId) {
        if (!window.ReactNativeWebView) {
          return;
        }

        var message = {
          type: type,
          payload: payload === undefined ? null : payload
        };

        if (requestId !== undefined && requestId !== null) {
          message.requestId = requestId;
        }

        window.ReactNativeWebView.postMessage(
          JSON.stringify(message)
        );
      }

      function respond(requestId, result) {
        post(
          "response",
          {
            success: true,
            result: result
          },
          requestId
        );
      }

      function respondError(requestId, error) {
        post(
          "response",
          {
            success: false,
            error: error && error.message
              ? error.message
              : String(error)
          },
          requestId
        );
      }

      function emitReady() {
        post("ready", {
          version: VERSION
        });
      }

      /* =========================================================
         MESSAGE PARSING
      ========================================================= */

      function normalizeMessage(data) {
        if (typeof data !== "string") {
          return data;
        }

        try {
          return JSON.parse(data);
        } catch (error) {
          return data;
        }
      }

      /*
       * Backwards compatibility with your current API.
       *
       * webViewRef.current.postMessage("bold")
       *
       * will still work.
       */
      function legacyMessageToCommand(value) {
        var commands = {
          bold: "bold",
          italic: "italic",
          underline: "underline",

          ol: "orderedList",
          ul: "unorderedList",

          check: "checklist",

          alignLeft: "alignLeft",
          alignCenter: "alignCenter",
          alignRight: "alignRight",
          alignJustify: "alignJustify",

          indent: "indent",
          outdent: "outdent",

          undo: "undo",
          redo: "redo",

          html: "getHTML"
        };

        return commands[value] || null;
      }

      function onBridgeMessage(event) {
        var message = normalizeMessage(event.data);

        /*
         * Legacy string messages
         */
        if (typeof message === "string") {
          var legacyCommand = legacyMessageToCommand(message);

          if (legacyCommand) {
            executeCommand(legacyCommand);
          }

          return;
        }

        if (!message || typeof message !== "object") {
          return;
        }

        var command =
          message.command ||
          message.type;

        var value =
          message.value !== undefined
            ? message.value
            : message.payload;

        var requestId = message.requestId;

        try {
          var result = executeCommand(command, value);

          if (requestId !== undefined) {
            respond(requestId, result);
          }
        } catch (error) {
          if (requestId !== undefined) {
            respondError(requestId, error);
          }

          post("error", {
            command: command,
            message: error.message || String(error)
          });
        }
      }

      /*
       * Android/iOS WebViews have historically differed in where
       * React Native messages are dispatched, so supporting both
       * keeps this bridge portable.
       */
      document.addEventListener(
        "message",
        onBridgeMessage,
        false
      );

      window.addEventListener(
        "message",
        onBridgeMessage,
        false
      );

      /* =========================================================
         SELECTION MANAGEMENT
      ========================================================= */

      function selectionInsideEditor(selection) {
        if (!selection || selection.rangeCount === 0) {
          return false;
        }

        var range = selection.getRangeAt(0);

        var node = range.commonAncestorContainer;

        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }

        return (
          node === editor ||
          editor.contains(node)
        );
      }

      function saveSelection() {
        var selection = window.getSelection();

        if (!selectionInsideEditor(selection)) {
          return false;
        }

        savedRange =
          selection
            .getRangeAt(0)
            .cloneRange();

        return true;
      }

      function placeCaretAtEnd() {
        editor.focus();

        var selection = window.getSelection();
        var range = document.createRange();

        range.selectNodeContents(editor);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);

        savedRange = range.cloneRange();
      }

      function restoreSelection() {
        editor.focus({
          preventScroll: true
        });

        if (!savedRange) {
          placeCaretAtEnd();
          return;
        }

        try {
          var selection = window.getSelection();

          selection.removeAllRanges();
          selection.addRange(savedRange);
        } catch (error) {
          /*
           * The stored DOM range may no longer exist after
           * replacing the entire editor HTML.
           */
          placeCaretAtEnd();
        }
      }

      function getCurrentRange() {
        restoreSelection();

        var selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
          return null;
        }

        return selection.getRangeAt(0);
      }

      /* =========================================================
         EXEC COMMAND WRAPPER
      ========================================================= */

      function exec(command, value) {
        restoreSelection();

        /*
         * Request CSS rather than old <font> / <b> markup where
         * the WebView supports it.
         */
        try {
          document.execCommand(
            "styleWithCSS",
            false,
            true
          );
        } catch (error) {}

        var supported = true;

        try {
          supported =
            document.queryCommandSupported(command);
        } catch (error) {}

        if (supported === false) {
          throw new Error(
            'Editing command "' +
            command +
            '" is not supported by this WebView.'
          );
        }

        var result =
          document.execCommand(
            command,
            false,
            value === undefined ? null : value
          );

        saveSelection();
        scheduleStateUpdate();
        scheduleChange();

        return result;
      }

      /* =========================================================
         INLINE FORMATTING
      ========================================================= */

      function setBold() {
        return exec("bold");
      }

      function setItalic() {
        return exec("italic");
      }

      function setUnderline() {
        return exec("underline");
      }

      function setStrikeThrough() {
        return exec("strikeThrough");
      }

      function setSubscript() {
        return exec("subscript");
      }

      function setSuperscript() {
        return exec("superscript");
      }

      function setTextColor(color) {
        return exec(
          "foreColor",
          color
        );
      }

      function setHighlightColor(color) {
        /*
         * Chromium/WebKit generally support hiliteColor.
         * backColor is retained as a fallback.
         */
        try {
          if (
            document.queryCommandSupported &&
            document.queryCommandSupported(
              "hiliteColor"
            )
          ) {
            return exec(
              "hiliteColor",
              color
            );
          }
        } catch (error) {}

        return exec(
          "backColor",
          color
        );
      }

      function setFontFamily(fontFamily) {
        return exec(
          "fontName",
          fontFamily
        );
      }

      /*
       * execCommand's font-size accepts values 1-7 rather than
       * arbitrary CSS sizes.
       *
       * We temporarily use size 7 and immediately replace the
       * generated <font> nodes with CSS spans.
       */
      function setFontSize(size) {
        if (
          typeof size === "number"
        ) {
          size = size + "px";
        }

        if (!size) {
          return false;
        }

        restoreSelection();

        try {
          document.execCommand(
            "styleWithCSS",
            false,
            false
          );

          document.execCommand(
            "fontSize",
            false,
            "7"
          );

          var fonts =
            editor.querySelectorAll(
              'font[size="7"]'
            );

          Array.prototype.forEach.call(
            fonts,
            function (font) {
              var span =
                document.createElement("span");

              span.style.fontSize = size;

              while (font.firstChild) {
                span.appendChild(
                  font.firstChild
                );
              }

              font.parentNode.replaceChild(
                span,
                font
              );
            }
          );
        } finally {
          try {
            document.execCommand(
              "styleWithCSS",
              false,
              true
            );
          } catch (error) {}
        }

        saveSelection();
        scheduleChange();
        scheduleStateUpdate();

        return true;
      }

      function clearFormatting() {
        return exec(
          "removeFormat"
        );
      }

      /* =========================================================
         BLOCK FORMATTING
      ========================================================= */

      function formatBlock(tag) {
        if (!tag) {
          tag = "p";
        }

        tag = String(tag)
          .toLowerCase();

        return exec(
          "formatBlock",
          "<" + tag + ">"
        );
      }

      function setParagraph() {
        return formatBlock("p");
      }

      function setHeading(level) {
        level = Number(level);

        if (
          level < 1 ||
          level > 6
        ) {
          return setParagraph();
        }

        return formatBlock(
          "h" + level
        );
      }

      function setBlockquote() {
        return formatBlock(
          "blockquote"
        );
      }

      function setCodeBlock() {
        return formatBlock(
          "pre"
        );
      }

      function alignLeft() {
        return exec(
          "justifyLeft"
        );
      }

      function alignCenter() {
        return exec(
          "justifyCenter"
        );
      }

      function alignRight() {
        return exec(
          "justifyRight"
        );
      }

      function alignJustify() {
        return exec(
          "justifyFull"
        );
      }

      function indent() {
        return exec(
          "indent"
        );
      }

      function outdent() {
        return exec(
          "outdent"
        );
      }

      /* =========================================================
         LISTS
      ========================================================= */

      function insertOrderedList() {
        return exec(
          "insertOrderedList"
        );
      }

      function insertUnorderedList() {
        return exec(
          "insertUnorderedList"
        );
      }

      /* =========================================================
         LINKS
      ========================================================= */

      function createLink(value) {
        var config =
          typeof value === "string"
            ? { url: value }
            : value || {};

        var url = config.url;

        if (!url) {
          return false;
        }

        restoreSelection();

        var selection =
          window.getSelection();

        /*
         * If nothing is selected, insert the URL/text as a link.
         */
        if (
          !selection ||
          selection.rangeCount === 0 ||
          selection.isCollapsed
        ) {
          var text =
            config.text || url;

          var anchor =
            document.createElement("a");

          anchor.href = url;
          anchor.textContent = text;

          if (config.target) {
            anchor.target =
              config.target;
          }

          if (
            config.target === "_blank"
          ) {
            anchor.rel =
              "noopener noreferrer";
          }

          var range =
            getCurrentRange();

          if (!range) {
            return false;
          }

          range.insertNode(anchor);

          range.setStartAfter(anchor);
          range.collapse(true);

          selection =
            window.getSelection();

          selection.removeAllRanges();
          selection.addRange(range);

          saveSelection();
          scheduleChange();

          return true;
        }

        exec(
          "createLink",
          url
        );

        /*
         * Apply optional attributes to the newly-created link.
         */
        if (config.target) {
          var node =
            window
              .getSelection()
              .anchorNode;

          if (
            node &&
            node.nodeType === Node.TEXT_NODE
          ) {
            node = node.parentNode;
          }

          var link =
            closestElement(node, "a");

          if (link) {
            link.target =
              config.target;

            if (
              config.target === "_blank"
            ) {
              link.rel =
                "noopener noreferrer";
            }
          }
        }

        return true;
      }

      function removeLink() {
        return exec(
          "unlink"
        );
      }

      /* =========================================================
         INSERTION
      ========================================================= */

      function insertText(text) {
        return exec(
          "insertText",
          String(
            text === undefined
              ? ""
              : text
          )
        );
      }

      function insertHTML(html) {
        return exec(
          "insertHTML",
          String(
            html === undefined
              ? ""
              : html
          )
        );
      }

      function insertHorizontalRule() {
        return exec(
          "insertHorizontalRule"
        );
      }

      function insertLineBreak() {
        return exec(
          "insertHTML",
          "<br>"
        );
      }

      function insertImage(value) {
        var options =
          typeof value === "string"
            ? { src: value }
            : value || {};

        if (!options.src) {
          return false;
        }

        restoreSelection();

        var range =
          getCurrentRange();

        if (!range) {
          return false;
        }

        var image =
          document.createElement("img");

        image.src =
          options.src;

        image.alt =
          options.alt || "";

        if (options.width) {
          image.style.width =
            typeof options.width === "number"
              ? options.width + "px"
              : options.width;
        }

        if (options.height) {
          image.style.height =
            typeof options.height === "number"
              ? options.height + "px"
              : options.height;
        }

        range.deleteContents();
        range.insertNode(image);

        range.setStartAfter(image);
        range.collapse(true);

        var selection =
          window.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);

        saveSelection();
        scheduleChange();

        return true;
      }

      /* =========================================================
         CHECKLIST
      ========================================================= */

      function createChecklistItem(text, checked) {
        var item =
          document.createElement("div");

        item.className =
          "checklist-item";

        if (checked) {
          item.classList.add(
            "checked"
          );
        }

        var checkbox =
          document.createElement("input");

        checkbox.type =
          "checkbox";

        checkbox.checked =
          !!checked;

        checkbox.contentEditable =
          "false";

        var content =
          document.createElement("span");

        content.className =
          "checklist-content";

        content.contentEditable =
          "true";

        if (text) {
          content.textContent =
            text;
        }

        item.appendChild(
          checkbox
        );

        item.appendChild(
          content
        );

        return {
          item: item,
          checkbox: checkbox,
          content: content
        };
      }

      function insertChecklist(value) {
        var options =
          value &&
          typeof value === "object"
            ? value
            : {};

        restoreSelection();

        var range =
          getCurrentRange();

        if (!range) {
          return false;
        }

        var checklist =
          createChecklistItem(
            options.text || "",
            options.checked
          );

        range.deleteContents();
        range.insertNode(
          checklist.item
        );

        /*
         * Put the caret into the checklist text.
         */
        var caret =
          document.createRange();

        caret.selectNodeContents(
          checklist.content
        );

        caret.collapse(false);

        var selection =
          window.getSelection();

        selection.removeAllRanges();
        selection.addRange(caret);

        saveSelection();
        scheduleChange();

        return true;
      }

      function handleChecklistChange(event) {
        var target =
          event.target;

        if (
          !target ||
          target.type !== "checkbox"
        ) {
          return;
        }

        var item =
          closestElement(
            target,
            ".checklist-item"
          );

        if (!item) {
          return;
        }

        item.classList.toggle(
          "checked",
          target.checked
        );

        scheduleChange();

        post(
          "checklistChange",
          {
            checked:
              target.checked
          }
        );
      }

      /*
       * Make Enter inside a checklist behave like a notes app:
       *
       * [ ] first item
       *      press Enter
       * [ ] second item
       */
      function handleChecklistKeyDown(event) {
        if (
          event.key !== "Enter"
        ) {
          return;
        }

        var target =
          event.target;

        var item =
          closestElement(
            target,
            ".checklist-item"
          );

        if (!item) {
          return;
        }

        event.preventDefault();

        var currentContent =
          item.querySelector(
            ".checklist-content"
          );

        /*
         * Empty checklist item + Enter exits checklist mode.
         */
        if (
          currentContent &&
          currentContent.textContent.trim() === ""
        ) {
          var paragraph =
            document.createElement("div");

          paragraph.appendChild(
            document.createElement("br")
          );

          item.parentNode.replaceChild(
            paragraph,
            item
          );

          placeCaretInside(
            paragraph
          );

          scheduleChange();

          return;
        }

        var next =
          createChecklistItem(
            "",
            false
          );

        if (item.nextSibling) {
          item.parentNode.insertBefore(
            next.item,
            item.nextSibling
          );
        } else {
          item.parentNode.appendChild(
            next.item
          );
        }

        placeCaretInside(
          next.content
        );

        scheduleChange();
      }

      /* =========================================================
         DOM HELPERS
      ========================================================= */

      function closestElement(node, selector) {
        if (!node) {
          return null;
        }

        if (
          node.nodeType ===
          Node.TEXT_NODE
        ) {
          node =
            node.parentElement;
        }

        if (
          !node ||
          !node.closest
        ) {
          return null;
        }

        var found =
          node.closest(selector);

        if (
          found &&
          editor.contains(found)
        ) {
          return found;
        }

        return null;
      }

      function placeCaretInside(element) {
        var range =
          document.createRange();

        range.selectNodeContents(
          element
        );

        range.collapse(false);

        var selection =
          window.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);

        savedRange =
          range.cloneRange();

        element.focus();
      }

      /* =========================================================
         DOCUMENT CONTENT
      ========================================================= */

      function getHTML() {
        return editor.innerHTML;
      }

      function getText() {
        return editor.innerText;
      }

      function setHTML(html) {
        html =
          html === undefined ||
          html === null
            ? ""
            : String(html);

        if (config.sanitizeHTML) {
          html =
            sanitizeHTML(html);
        }

        editor.innerHTML =
          html;

        savedRange =
          null;

        scheduleStateUpdate();

        return true;
      }

      function appendHTML(html) {
        restoreSelection();

        var previous =
          savedRange;

        placeCaretAtEnd();

        insertHTML(html);

        if (previous) {
          savedRange =
            previous;
        }

        return true;
      }

      function clear() {
        editor.innerHTML = "";
        savedRange = null;

        scheduleChange();
        scheduleStateUpdate();

        return true;
      }

      function isEmpty() {
        var text =
          editor.innerText
            .replace(/\\u200B/g, "")
            .trim();

        var meaningfulElements =
          editor.querySelector(
            "img, video, audio, input, hr"
          );

        return (
          text.length === 0 &&
          !meaningfulElements
        );
      }

      /* =========================================================
         SIMPLE HTML SANITIZER
      ========================================================= */

      function sanitizeHTML(html) {
        var container =
          document.createElement("div");

        container.innerHTML =
          html;

        var forbidden =
          container.querySelectorAll(
            "script, iframe, object, embed, frame, frameset"
          );

        Array.prototype.forEach.call(
          forbidden,
          function (element) {
            element.remove();
          }
        );

        var all =
          container.querySelectorAll("*");

        Array.prototype.forEach.call(
          all,
          function (element) {
            Array.prototype
              .slice
              .call(element.attributes)
              .forEach(
                function (attribute) {
                  var name =
                    attribute.name
                      .toLowerCase();

                  var value =
                    String(
                      attribute.value
                    )
                      .trim()
                      .toLowerCase();

                  if (
                    name.indexOf("on") === 0
                  ) {
                    element.removeAttribute(
                      attribute.name
                    );

                    return;
                  }

                  if (
                    (
                      name === "href" ||
                      name === "src"
                    ) &&
                    value.indexOf(
                      "javascript:"
                    ) === 0
                  ) {
                    element.removeAttribute(
                      attribute.name
                    );
                  }
                }
              );
          }
        );

        return container.innerHTML;
      }

      /* =========================================================
         EDITOR SETTINGS
      ========================================================= */

      function setPlaceholder(value) {
        editor.setAttribute(
          "data-placeholder",
          value || ""
        );

        return true;
      }

      function setEditable(value) {
        editor.contentEditable =
          value === false
            ? "false"
            : "true";

        return true;
      }

      function setSpellcheck(value) {
        editor.spellcheck =
          value !== false;

        return true;
      }

      function setTheme(value) {
        var theme =
          value || {};

        var root =
          document.documentElement;

        if (theme.backgroundColor) {
          root.style.setProperty(
            "--editor-background",
            theme.backgroundColor
          );
        }

        if (theme.color) {
          root.style.setProperty(
            "--editor-color",
            theme.color
          );
        }

        if (theme.placeholderColor) {
          root.style.setProperty(
            "--editor-placeholder",
            theme.placeholderColor
          );
        }

        if (theme.linkColor) {
          root.style.setProperty(
            "--editor-link",
            theme.linkColor
          );
        }

        if (theme.selectionColor) {
          root.style.setProperty(
            "--editor-selection",
            theme.selectionColor
          );
        }

        return true;
      }

      function setEditorStyle(value) {
        var styles =
          value || {};

        Object.keys(styles).forEach(
          function (key) {
            try {
              editor.style[key] =
                styles[key];
            } catch (error) {}
          }
        );

        return true;
      }

      function configure(value) {
        if (
          !value ||
          typeof value !== "object"
        ) {
          return config;
        }

        Object.keys(value).forEach(
          function (key) {
            if (
              Object.prototype
                .hasOwnProperty
                .call(config, key)
            ) {
              config[key] =
                value[key];
            }
          }
        );

        return config;
      }

      /* =========================================================
         SELECTION / FORMATTING STATE
      ========================================================= */

      function queryState(command) {
        try {
          return !!document
            .queryCommandState(
              command
            );
        } catch (error) {
          return false;
        }
      }

      function queryValue(command) {
        try {
          return document
            .queryCommandValue(
              command
            );
        } catch (error) {
          return null;
        }
      }

      function getBlockType() {
        var selection =
          window.getSelection();

        if (
          !selection ||
          selection.rangeCount === 0
        ) {
          return null;
        }

        var node =
          selection.anchorNode;

        if (
          node &&
          node.nodeType ===
          Node.TEXT_NODE
        ) {
          node =
            node.parentNode;
        }

        while (
          node &&
          node !== editor
        ) {
          var tag =
            node.tagName
              ? node.tagName
                  .toLowerCase()
              : "";

          if (
            tag === "p" ||
            tag === "div" ||
            tag === "h1" ||
            tag === "h2" ||
            tag === "h3" ||
            tag === "h4" ||
            tag === "h5" ||
            tag === "h6" ||
            tag === "blockquote" ||
            tag === "pre"
          ) {
            return tag;
          }

          node =
            node.parentNode;
        }

        return null;
      }

      function getSelectionState() {
        var selection =
          window.getSelection();

        var selectedText =
          selection
            ? selection.toString()
            : "";

        return {
          bold:
            queryState("bold"),

          italic:
            queryState("italic"),

          underline:
            queryState("underline"),

          strikeThrough:
            queryState(
              "strikeThrough"
            ),

          subscript:
            queryState(
              "subscript"
            ),

          superscript:
            queryState(
              "superscript"
            ),

          orderedList:
            queryState(
              "insertOrderedList"
            ),

          unorderedList:
            queryState(
              "insertUnorderedList"
            ),

          alignLeft:
            queryState(
              "justifyLeft"
            ),

          alignCenter:
            queryState(
              "justifyCenter"
            ),

          alignRight:
            queryState(
              "justifyRight"
            ),

          alignJustify:
            queryState(
              "justifyFull"
            ),

          fontName:
            queryValue(
              "fontName"
            ),

          fontSize:
            getComputedSelectionStyle(
              "fontSize"
            ),

          color:
            getComputedSelectionStyle(
              "color"
            ),

          backgroundColor:
            getComputedSelectionStyle(
              "backgroundColor"
            ),

          blockType:
            getBlockType(),

          selectedText:
            selectedText,

          selectionCollapsed:
            selection
              ? selection.isCollapsed
              : true
        };
      }

      function getComputedSelectionStyle(
        property
      ) {
        var selection =
          window.getSelection();

        if (
          !selection ||
          selection.rangeCount === 0
        ) {
          return null;
        }

        var node =
          selection.anchorNode;

        if (
          node &&
          node.nodeType ===
          Node.TEXT_NODE
        ) {
          node =
            node.parentElement;
        }

        if (
          !node ||
          node === editor
        ) {
          node = editor;
        }

        try {
          return window
            .getComputedStyle(node)[
              property
            ];
        } catch (error) {
          return null;
        }
      }

      function scheduleStateUpdate() {
        if (
          !config.emitSelectionState
        ) {
          return;
        }

        clearTimeout(stateTimer);

        stateTimer =
          setTimeout(
            function () {
              post(
                "selectionState",
                getSelectionState()
              );
            },
            20
          );
      }

      /* =========================================================
         CHANGE EVENTS
      ========================================================= */

      function scheduleChange() {
        if (!config.emitChanges) {
          return;
        }

        clearTimeout(changeTimer);

        changeTimer =
          setTimeout(
            function () {
              post(
                "change",
                {
                  html:
                    getHTML(),

                  text:
                    getText(),

                  empty:
                    isEmpty()
                }
              );
            },
            config.changeDebounce
          );
      }

      /* =========================================================
         FOCUS
      ========================================================= */

      function focusEditor() {
        restoreSelection();
        return true;
      }

      function blurEditor() {
        editor.blur();
        return true;
      }

      /* =========================================================
         UNDO / REDO
      ========================================================= */

      function undo() {
        return exec("undo");
      }

      function redo() {
        return exec("redo");
      }

      /* =========================================================
         COMMAND ROUTER
      ========================================================= */

      function executeCommand(
        command,
        value
      ) {
        switch (command) {

          /* ----- Content ----- */

          case "setHTML":
            return setHTML(value);

          case "getHTML":
            return getHTML();

          case "saveNote":
            return saveNote();

          case "getText":
            return getText();

          case "clear":
            return clear();

          case "isEmpty":
            return isEmpty();


          /* ----- Inline formatting ----- */

          case "bold":
            return setBold();

          case "italic":
            return setItalic();

          case "underline":
            return setUnderline();

          case "strike":
          case "strikeThrough":
            return setStrikeThrough();

          case "subscript":
            return setSubscript();

          case "superscript":
            return setSuperscript();

          case "color":
          case "textColor":
            return setTextColor(value);

          case "highlight":
          case "highlightColor":
            return setHighlightColor(value);

          case "fontFamily":
            return setFontFamily(value);

          case "fontSize":
          case "font-size":
            return setFontSize(value);

          case "clearFormatting":
          case "removeFormat":
            return clearFormatting();


          /* ----- Blocks ----- */

          case "paragraph":
            return setParagraph();

          case "heading":
            return setHeading(value);

          case "blockquote":
            return setBlockquote();

          case "codeBlock":
            return setCodeBlock();

          case "formatBlock":
            return formatBlock(value);


          /* ----- Alignment ----- */

          case "alignLeft":
            return alignLeft();

          case "alignCenter":
            return alignCenter();

          case "alignRight":
            return alignRight();

          case "alignJustify":
            return alignJustify();

          case "indent":
            return indent();

          case "outdent":
            return outdent();


          /* ----- Lists ----- */

          case "orderedList":
          case "ol":
            return insertOrderedList();

          case "unorderedList":
          case "ul":
            return insertUnorderedList();

          case "checklist":
          case "check":
            return insertChecklist(value);


          /* ----- Links ----- */

          case "link":
          case "createLink":
            return createLink(value);

          case "unlink":
          case "removeLink":
            return removeLink();


          /* ----- Insert ----- */

          case "insertText":
            return insertText(value);

          case "insertHTML":
            return insertHTML(value);

          case "insertImage":
            return insertImage(value);

          case "horizontalRule":
          case "insertHorizontalRule":
            return insertHorizontalRule();

          case "lineBreak":
            return insertLineBreak();


          /* ----- History ----- */

          case "undo":
            return undo();

          case "redo":
            return redo();


          /* ----- Editor ----- */

          case "focus":
            return focusEditor();
          
          case "blur":
            return blurEditor();

          case "setEditable":
            return setEditable(value);

          case "setPlaceholder":
            return setPlaceholder(value);

          case "setSpellcheck":
            return setSpellcheck(value);

          case "setTheme":
            return setTheme(value);

          case "setEditorStyle":
            return setEditorStyle(value);

          case "configure":
            return configure(value);

          case "getSelectionState":
            return getSelectionState();

          /*
           * Escape hatch.
           *
           * Allows your native app to issue an execCommand
           * that hasn't received a dedicated API method yet.
           *
           * {
           *   command: "exec",
           *   value: {
           *     command: "someCommand",
           *     value: "something"
           *   }
           * }
           */
          case "exec":
            if (
              !value ||
              !value.command
            ) {
              throw new Error(
                "exec requires a command."
              );
            }

            return exec(
              value.command,
              value.value
            );

          default:
            throw new Error(
              'Unknown editor command: "' +
              command +
              '"'
            );
        }
      }

      /* =========================================================
         EDITOR EVENTS
      ========================================================= */

      editor.addEventListener(
        "input",
        function () {
          post("contentChanged",
              editor.innerHTML)
          saveSelection();
          scheduleChange();
          scheduleStateUpdate();
        }
      );

      editor.addEventListener(
        "keyup",
        function () {
          saveSelection();
          scheduleStateUpdate();
        }
      );

      editor.addEventListener(
        "mouseup",
        function () {
          saveSelection();
          scheduleStateUpdate();
        }
      );

      editor.addEventListener(
        "touchend",
        function () {
          saveSelection();
          scheduleStateUpdate();
        }
      );

      editor.addEventListener(
        "focus",
        function () {
          saveSelection();

          post(
            "focus",
            null
          );

          scheduleStateUpdate();
        }
      );

      editor.addEventListener(
        "blur",
        function () {
          /*
           * Do NOT clear savedRange.
           *
           * This is important because tapping a React Native
           * toolbar button may cause the WebView/editor to lose
           * focus. The formatting command can then restore the
           * user's previous selection.
           */
          post(
            "blur",
            null
          );
        }
      );

      editor.addEventListener(
        "change",
        handleChecklistChange
      );

      editor.addEventListener(
        "keydown",
        handleChecklistKeyDown
      );

      document.addEventListener(
        "selectionchange",
        function () {
          var selection =
            window.getSelection();

          if (
            selectionInsideEditor(
              selection
            )
          ) {
            saveSelection();
            scheduleStateUpdate();
          }
        }
      );

      /* =========================================================
         INITIALIZATION
      ========================================================= */

      emitReady();

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "ready",
      }),
);

    })();
  </script>
</body>
</html>
`;

export default editorHTML;
