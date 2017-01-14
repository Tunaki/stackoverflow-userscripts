// ==UserScript==
// @name         NAA Reporter
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.10
// @description  Adds a NAA link below answers that sends a report for Natty in SOBotics. Intended to be used for answers flaggable as NAA / VLQ.
// @author       Tunaki
// @include      /^https?:\/\/\w*.?stackoverflow.com\/.*/
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// ==/UserScript==

var room = 111347;

function sendChatMessage(msg) {
  GM_xmlhttpRequest({
    method: 'GET', 
    url: 'http://chat.stackoverflow.com/rooms/' + room, 
    onload: function (response) {
      var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'http://chat.stackoverflow.com/chats/' + room + '/messages/new',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'text=' + encodeURIComponent(msg) + '&fkey=' + fkey
      });
    }
  });
}

function sendSentinelAndChat(answerId) {
  var link = 'http://stackoverflow.com/a/' + answerId;
  var match = /(?:https?:\/\/)?(?:www\.)?(.*)\.com\/(.*)(?:\/([0-9]+))?/g.exec(link);
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
        sendChatMessage('@Natty feedback ' + link + ' tp');
      } else {
        sendChatMessage('@Natty report ' + link);
      }
      $('[data-answerid="' + answerId + '"] a.report-naa-link').addClass('naa-reported').click(function (e) { e.preventDefault(); }).html('NAA reported!');
    },
    onerror: function (sentinelResponse) {
      alert('Error while reporting: ' + sentinelResponse.responseText);
    }
  });
}

function sendRequest(event) {
  var messageJSON;
  try {
    messageJSON = JSON.parse(event.data);
  } catch (zError) { }
  if (!messageJSON) return;
  if (messageJSON[0] == 'postHrefReportNAA') {
      $.get('//api.stackexchange.com/2.2/posts/'+messageJSON[1]+'?site=stackoverflow&key=qhq7Mdy8)4lSXLCjrzQFaQ((&filter=!3tz1WbZYQxC_IUm7Z', function(aRes) {
      // post is deleted, just report it (it can only be an answer since VLQ-flaggable question are only from review, thus not deleted), otherwise, check that it is really an answer and then its date
      if (aRes.items.length === 0) {
        sendSentinelAndChat(messageJSON[1]);
      } else if (aRes.items[0]['post_type'] === 'answer') {
        var answerDate = aRes.items[0]['creation_date'];
        var currentDate = Date.now() / 1000;
        // only do something when answer was posted today
        if (Math.round((currentDate - answerDate) / (24 * 60 * 60)) <= 1) {
          $.get('//api.stackexchange.com/2.2/answers/'+messageJSON[1]+'/questions?site=stackoverflow&key=qhq7Mdy8)4lSXLCjrzQFaQ((&filter=!)8aBxR_Gih*BsCr', function(qRes) {
            var questionDate = qRes.items[0]['creation_date'];
            // only do something when answer was posted at least 30 days after the question
            if (Math.round((answerDate - questionDate) / (24 * 60 * 60)) > 30) {
              sendSentinelAndChat(messageJSON[1]);
            }
          });
        }
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
  
  function handleAnswers(postId) {
    var $posts;
    if(!postId) {
      $posts = $('.answer .post-menu');
    } else {
      $posts = $('[data-answerid="' + postId + '"] .post-menu');
    }
    $posts.each(function() {
      var $this = $(this);
      var postId = $this.find('a.short-link').attr('id').split('-')[2];
      $this.append($('<span>').attr('class', 'lsep').html('|'));
      $this.append($('<a>').attr('class', 'report-naa-link').click(function (e) {
        e.preventDefault();
        if ($(this).hasClass('naa-reported') || !confirm('Do you really want to report this post as NAA?')) return false;
        window.postMessage(JSON.stringify(['postHrefReportNAA', postId]), "*");
      }).html('NAA'));
    });
  };

  addXHRListener(function(xhr) {
    if (/ajax-load-realtime/.test(xhr.responseURL)) {
      let matches = /answer" data-answerid="(\d+)/.exec(xhr.responseText);
      if (matches !== null) {
        handleAnswers(matches[1]);
      }
    }
  });
  
  addXHRListener(function(xhr) {
    let matches = /flags\/posts\/(\d+)\/add\/(AnswerNotAnAnswer|PostLowQuality)/.exec(xhr.responseURL);
    if (matches !== null && xhr.status === 200) {
      window.postMessage(JSON.stringify(['postHrefReportNAA', matches[1]]), "*");
    }
  });

  $(document).ready(function() {
    handleAnswers(); 
  });

}

const ScriptToInjectNode = document.createElement('script');
document.body.appendChild(ScriptToInjectNode);

const ScriptToInjectContent = document.createTextNode('(' + ScriptToInject.toString() + ')()');
ScriptToInjectNode.appendChild(ScriptToInjectContent);
