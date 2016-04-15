// ==UserScript==
// @name         Flag Request Generator
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.2
// @description  Adds a link below each posts that sends a flag-pls request to a chat room. Intended to be used for NAA/VLQ answers.
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/.*/
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript==

var room = 108192;

function sendRequest(event) {
  var messageJSON;
  try {
    messageJSON = JSON.parse(event.data);
  } catch (zError) { }
  if (!messageJSON) return;
  if (messageJSON[0] == 'postHref') {
    var link = messageJSON[1];
    if (!confirm('Do you really want to request a flag for this post?')) {
      return false;
    }
    GM_xmlhttpRequest({
      method: 'GET', 
      url: 'http://chat.stackoverflow.com/rooms/' + room, 
      onload: function (response) {
        var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
        var reportStr = '[tag:flag-pls] ' + link;
        GM_xmlhttpRequest({
          method: 'POST',
          url: 'http://chat.stackoverflow.com/chats/' + room + '/messages/new',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data: 'text=' + encodeURIComponent(reportStr) + '&fkey=' + fkey
        });
      }
    });
  }
};

window.addEventListener('message', sendRequest, false);

const ScriptToInject = function() {
  function addXHRListener(callback) {
    let open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener('load', callback.bind(null, this), false);
      open.apply(this, arguments);
    };
  };

  function addFlagPlsLink(postId) {
    var $posts;
    if(!postId) {
      $posts = $('.answer .post-menu');
    } else {
      $posts = $('[data-answerid="' + postId + '"] .post-menu');
    }
    $posts.each(function() {
      var $this = $(this);
      var $postLink = $this.find('a.short-link');
      var postId = $postLink.attr('id').split('-')[2];
      $this.append($('<span>').attr('class', 'lsep').html('|'));
      $this.append($('<a>').attr('class', 'flag-pls-link').html('flag-pls').click(function (e) {
          e.preventDefault();
          var href = $postLink.get(0).href;
          var messageTxt = JSON.stringify(['postHref', href]);
          window.postMessage(messageTxt, "*");
      }));
    });
  };
    
  addXHRListener(function(xhr) {
    if (/ajax-load-realtime/.test(xhr.responseURL)) {
      let matches = /answer" data-answerid="(\d+)/.exec(xhr.responseText);
      if (matches !== null) {
        addFlagPlsLink(matches[1]);
      }
    }
  });

  $(document).ready(function() {
    addFlagPlsLink(); 
  });
}

const ScriptToInjectNode = document.createElement('script');
document.body.appendChild(ScriptToInjectNode);

const ScriptToInjectContent = document.createTextNode('(' + ScriptToInject.toString() + ')()');
ScriptToInjectNode.appendChild(ScriptToInjectContent);
