// ==UserScript==
// @name         Show Timeline
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.3
// @description  Adds an anchor below posts that links to their timeline
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/.*/
// @grant        none
// ==/UserScript==

let funcs = {};

funcs.addXHRListener = callback => {
    let open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', callback.bind(null, this), false);
        open.apply(this, arguments);
    };
};

funcs.addXHRListener(xhr => {
    if (/ajax-load-realtime/.test(xhr.responseURL)) {
        addTimelineLink();
    }
});

function addTimelineLink() {  
  $('.post-menu:not(:has(.timeline-link))').each(function() {
    var $this = $(this);
    var postId = $this.find('a.short-link').attr('id').split('-')[2];
    $this.append($('<span>').attr('class', 'lsep').html('|'));
    $this.append($('<a>').attr({
      'class': 'timeline-link', 
      'href': '/posts/' + postId + '/timeline'
    }).html('timeline'));
  });
}

addTimelineLink();
