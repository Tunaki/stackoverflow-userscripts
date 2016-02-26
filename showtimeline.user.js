// ==UserScript==
// @name         Show Timeline
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.2
// @description  Adds an anchor below posts that links to their timeline
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/q(uestions)?\/\d+/
// @grant        none
// ==/UserScript==

$('.post-menu').each(function() {
  var $this = $(this);
  var postId = $this.find('a.short-link').attr('id').split('-')[2];
  $this.append($('<span>').attr('class', 'lsep').html('|'));
  $this.append($('<a>').attr({
    'class': 'timeline-link', 
    'href': '/posts/' + postId + '/timeline'
  }).html('timeline'));
});
