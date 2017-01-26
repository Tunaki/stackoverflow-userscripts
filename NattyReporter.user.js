// ==UserScript==
// @name         Natty Reporter
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.11.4
// @description  Adds a Natty link below answers that sends a report for the bot in SOBotics. Intended to be used to give feedback on reports (true positive / false positive / needs edit) or report NAA/VLQ-flaggable answers.
// @author       Tunaki
// @include      /^https?:\/\/(www\.)?stackoverflow\.com\/.*/
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @downloadURL  https://github.com/Tunaki/stackoverflow-userscripts/raw/master/NattyReporter.user.js
// ==/UserScript==

var room = 111347;

function sendChatMessage(msg, answerId) {
  GM_xmlhttpRequest({
    method: 'GET', 
    url: 'http://chat.stackoverflow.com/rooms/' + room, 
    onload: function (response) {
      var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'http://chat.stackoverflow.com/chats/' + room + '/messages/new',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'text=' + encodeURIComponent(msg) + '&fkey=' + fkey,
        onload: function (r) {
          $('[data-answerid="' + answerId + '"] a.report-natty-link').addClass('natty-reported').html('Reported to Natty!');
        }
      });
    }
  });
}

function sendSentinelAndChat(answerId, feedback) {
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
        sendChatMessage('@Natty feedback ' + link + ' ' + feedback, answerId);
      } else if (feedback === 'tp') {
        sendChatMessage('@Natty report ' + link, answerId);
      }
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
  if (messageJSON[0] == 'postHrefReportNatty') {
      $.get('//api.stackexchange.com/2.2/posts/'+messageJSON[1]+'?site=stackoverflow&key=qhq7Mdy8)4lSXLCjrzQFaQ((&filter=!3tz1WbZYQxC_IUm7Z', function(aRes) {
      // post is deleted, just report it (it can only be an answer since VLQ-flaggable question are only from review, thus not deleted), otherwise, check that it is really an answer and then its date
      if (aRes.items.length === 0) {
        sendSentinelAndChat(messageJSON[1], messageJSON[2]);
      } else if (aRes.items[0]['post_type'] === 'answer') {
        var answerDate = aRes.items[0]['creation_date'];
        var currentDate = Date.now() / 1000;
        // only do something when answer was posted today
        if (Math.round((currentDate - answerDate) / (24 * 60 * 60)) <= 1) {
          $.get('//api.stackexchange.com/2.2/answers/'+messageJSON[1]+'/questions?site=stackoverflow&key=qhq7Mdy8)4lSXLCjrzQFaQ((&filter=!)8aBxR_Gih*BsCr', function(qRes) {
            var questionDate = qRes.items[0]['creation_date'];
            // only do something when answer was posted at least 30 days after the question
            if (Math.round((answerDate - questionDate) / (24 * 60 * 60)) > 30) {
              sendSentinelAndChat(messageJSON[1], messageJSON[2]);
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
  
  function reportToNatty(e) {
    e.preventDefault();
    var $this = $(this);
    if ($this.closest('a.natty-reported').length > 0) return false;
    var postId = $this.closest('div.post-menu').find('a.short-link').attr('id').split('-')[2];
    var feedback = $this.text();
    if (!confirm('Do you really want to report this post with feedback \'' + feedback + '\'?')) return false;
    window.postMessage(JSON.stringify(['postHrefReportNatty', postId, feedback]), "*");
  }
  
  function handleAnswers(postId) {
    var $posts;
    if(!postId) {
      $posts = $('.answer .post-menu');
    } else {
      $posts = $('[data-answerid="' + postId + '"] .post-menu');
    }
    $posts.each(function() {
      var $this = $(this);
      $this.append($('<span>').attr('class', 'lsep').html('|'));
      var $dropdown = $('<dl>').css({ 'margin': '0', 'z-index': '1', 'position': 'absolute', 'white-space': 'nowrap', 'background': '#FFF' }).hide();
      $.each(['tp', 'fp', 'ne'], function(i, val) { $dropdown.append($('<dd>').append($('<a>').css({ 'display': 'block', 'width': '35px' }).click(reportToNatty).text(val))); });
      $this.append($('<a>').attr('class', 'report-natty-link').html('Natty').hover(function() { $dropdown.toggle(); }).append($dropdown));
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
      window.postMessage(JSON.stringify(['postHrefReportNatty', matches[1], 'tp']), "*");
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
