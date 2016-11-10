// ==UserScript==
// @name         NAA Reporter
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.1
// @description  Adds a NAA link below answers that sends a report for NATOBot in SOBotics. Intended to be used for answers flaggable as NAA / VLQ.
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/.*/
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript==

var room = 111347;

function sendRequest(event) {
  var messageJSON;
  try {
    messageJSON = JSON.parse(event.data);
  } catch (zError) { }
  if (!messageJSON) return;
  if (messageJSON[0] == 'postHrefReportNAA') {
    var link = messageJSON[1];
    if (!confirm('Do you really want to report this post?')) {
      return false;
    }
    var match = /(?:https?:\/\/)?(?:www\.)?(.*)\.com\/(.*)\/([0-9]+)/g.exec(link);
    var sentinelUrl = 'http://www.' + match[1] + '.com/' + match[2];
    GM_xmlhttpRequest({
      method: 'GET', 
      url: 'http://sentinel.erwaysoftware.com/api/posts/by_url?key=1e7cb25155eb89910e2f0cb2b3a246ef49a0658bdd014f2b53903e480287deda&url=' + encodeURIComponent(sentinelUrl),
      onload: function (sentinelResponse) {
        if (sentinelResponse.status !== 200) {
          alert('Error while reporting: status ' + sentinelResponse.status);
          return;
        }
        var sentinelJson = JSON.parse(sentinelResponse.responseText);
        if (sentinelJson.items.length > 0) {
          alert('Post was already reported.');
          return;
        }
        GM_xmlhttpRequest({
        method: 'GET', 
          url: 'http://chat.stackoverflow.com/rooms/' + room, 
          onload: function (response) {
            var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
            var reportStr = '@NATOBot report ' + link;
            GM_xmlhttpRequest({
              method: 'POST',
              url: 'http://chat.stackoverflow.com/chats/' + room + '/messages/new',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              data: 'text=' + encodeURIComponent(reportStr) + '&fkey=' + fkey
            });
          }
        });
      },
      onerror: function (sentinelResponse) {
        alert('Error while reporting: ' + sentinelResponse.responseText);
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
      $posts = $('#answers .post-menu');
    } else {
      $posts = $('[data-answerid="' + postId + '"] .post-menu');
    }
    $posts.each(function() {
      var $this = $(this);
      var $postLink = $this.find('a.short-link');
      var postId = $postLink.attr('id').split('-')[2];
      $this.append($('<span>').attr('class', 'lsep').html('|'));
      $this.append($('<a>').attr('class', 'report-link').html('NAA').click(function (e) {
          e.preventDefault();
          var href = $postLink.get(0).href;
          var messageTxt = JSON.stringify(['postHrefReportNAA', href]);
          window.postMessage(messageTxt, "*");
      }));
    });
  };
    
  addXHRListener(function(xhr) {
    let matches = /answer" data-answerid="(\d+)/.exec(xhr.responseText);
    if (matches === null) {
      return;
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
