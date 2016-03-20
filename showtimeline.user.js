// ==UserScript==
// @name         Show Timeline
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.3
// @description  Adds an anchor below posts that links to their timeline
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/.*/
// @grant        none
// ==/UserScript==

function addXHRListener(callback) {
  let open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('load', callback.bind(null, this), false);
    open.apply(this, arguments);
  };
};

function addTimelineLink(postId) {
  var $posts;
  if(!postId) {
    $posts = $('.post-menu');
  } else {
    $posts = $('[data-questionid="' + postId + '"] .post-menu,[data-answerid="' + postId + '"] .post-menu');
  }
  $posts.each(function() {
    var $this = $(this);
    var postId = $this.find('a.short-link').attr('id').split('-')[2];
    $this.append($('<span>').attr('class', 'lsep').html('|'));
    $this.append($('<a>').attr({
      'class': 'timeline-link', 
      'href': '/posts/' + postId + '/timeline'
    }).html('timeline'));
  });
};

addXHRListener(function(xhr) {
  if (/ajax-load-realtime/.test(xhr.responseURL)) {
    let matches = /question" data-questionid="(\d+)/.exec(xhr.responseText);
    if (matches === null) {
      matches = /answer" data-answerid="(\d+)/.exec(xhr.responseText);
      if (matches === null) {
        return;
      }
    }
    addTimelineLink(matches[1]);
  }
});

$(document).ready(function() {
  addTimelineLink(); 
});
