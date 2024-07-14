const editorHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        html {
            height: 100%;
            width: 100%;
            background-color: #000;
        }
        body {
            display: flex;
            flex-grow: 1;
            flex-direction: column;
            height: 100%;
            margin: 0;
            background-color: #000;
        }
        body::focus {
        	outline: none;
        	border: none;
        }
        #editor {
           flex-grow: 1;
           background-color: #000;
           color: #fff;
           border: none;
           outline: none;
        }
    </style>
</head>
<body>
  <div id="editor" contentEditable>
  </div>
  <script>
  (function(doc) {
    var editor = document.getElementById('editor');
    editor.contentEditable = true;

    var getRequest = function(event) {  
      switch (event.data) {
        case 'bold':
          document.execCommand('bold', false, '');
          break;
        case 'italic':
            document.execCommand('italic', false, '');
            break;
        case 'underline':
            document.execCommand('underline',false,'');
            break;
        case 'ol':
            document.execCommand('insertOrderedList',false,null);
            break;
        case 'ul':
            document.execCommand('insertUnorderedList',false,null);
            break;
        case 'check':
            insertCheckList();
            break;
        case 'html':
              sendMessage(
                editor.innerHTML
             );
              break;
        case 'alignLeft':
              document.execCommand('justifyLeft', false, null);
              break;
        case 'alignCenter':
             document.execCommand('justifyCenter', false, null);
              break;
        case 'alignRight':
             document.execCommand('justifyRight', false, null);
              break;
        case 'alignJustify':
             document.execCommand('justifyFull', false, null);
              break;
    case 'indent':
            document.execCommand('indent', false, null);
            break;
        case 'outdent':
            document.execCommand('outdent', false, null);
            break;
        case 'undo':
             document.execCommand('undo', false, null);
              break;
        case 'redo':
             document.execCommand('redo', false, null);
              break;
        default:
          break;
      }
    }

      var insertCheckList = function() {
      var range = window.getSelection().getRangeAt(0);
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      var span = document.createElement('span');
      span.contentEditable = 'true';
      var div = document.createElement('div');
      div.className = 'checklist-item';
      div.appendChild(checkbox);
      div.appendChild(span);
      range.insertNode(div);
    };

    var sendMessage = function(message) {
      if(window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(message);
    }


    document.addEventListener("message", getRequest , false);
    window.addEventListener("message", getRequest , false);

  })(document)
</script>
</body>
</html>
`;

export default editorHTML;
