// ==UserScript==
// @name         Spam Reporter
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.1
// @description  Adds a report link below answers that sends a report for SmokeDetector in SOCVR. Intended to be used for spam / offensive answers.
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/.*/
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript==

var room = 41570;

function sendRequest(event) {
  var messageJSON;
  try {
    messageJSON = JSON.parse(event.data);
  } catch (zError) { }
  if (!messageJSON) return;
  if (messageJSON[0] == 'postHrefReport') {
    var link = messageJSON[1];
    if (!confirm('Do you really want to report this post?')) {
      return false;
    }
    GM_xmlhttpRequest({
      method: 'GET', 
      url: 'http://chat.stackoverflow.com/rooms/' + room, 
      onload: function (response) {
        var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
        var reportStr = '!!/report ' + link;
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

  function addReportLink(postId) {
    var $posts;
    if(!postId) {
      $posts = $('.post-menu');
    } else {
      $posts = $('[data-questionid="' + postId + '"] .post-menu,[data-answerid="' + postId + '"] .post-menu');
    }
    $posts.each(function() {
      var $this = $(this);
      var $postLink = $this.find('a.short-link');
      var postId = $postLink.attr('id').split('-')[2];
      $this.append($('<span>').attr('class', 'lsep').html('|'));
      $this.append($('<a>').attr('class', 'report-link').html('report').click(function (e) {
          e.preventDefault();
          var href = $postLink.get(0).href;
          var messageTxt = JSON.stringify(['postHrefReport', href]);
          window.postMessage(messageTxt, "*");
      }));
    });
  };
    
  addXHRListener(function(xhr) {
    let matches = /question" data-questionid="(\d+)/.exec(xhr.responseText);
    if (matches === null) {
      matches = /answer" data-answerid="(\d+)/.exec(xhr.responseText);
      if (matches === null) {
        return;
      }
    }
    addReportLink(matches[1]);
  });

  $(document).ready(function() {
    addReportLink(); 
  });
}

const ScriptToInjectNode = document.createElement('script');
document.body.appendChild(ScriptToInjectNode);

const ScriptToInjectContent = document.createTextNode('(' + ScriptToInject.toString() + ')()');
ScriptToInjectNode.appendChild(ScriptToInjectContent);
