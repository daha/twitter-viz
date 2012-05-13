// Copyright (c) 2012, David Haglund
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
//     * Redistributions of source code must retain the above
//       copyright notice, this list of conditions and the following
//       disclaimer.
//
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials
//       provided with the distribution.
//
//     * Neither the name of the copyright holder nor the names of its
//       contributors may be used to endorse or promote products
//       derived from this software without specific prior written
//       permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
// FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE.
$(document).ready(function() {
    var user_info_url = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
         user_timeline_url = ('https://api.twitter.com/1/statuses/user_timeline.json'
                            + '?callback=?'
                            + '&count=2'
                            + '&trim_user=1'
                            + '&include_entities=1'
                            + '&include_rts=1'
                            + '&contributor_details=t'
                            + '&screen_name='),
        twitter_username = '';

    function insertLabeledText(selector, label, text) {
        if (text !== '') {
            selector.append('<dt>' + label + '</dt><dd>' + text + '</dd>');
        }
    }

    function fetch_user_tweets(username) {
        // TODO: handle when the query changes while fetching data for an old query
        // TODO: add state for max_id & since_id
        console.log("fetching tweets for " + username);
        $.jsonp({
            url: user_timeline_url + username,
            success: function (response) {
                if (username === twitter_username) {
                    console.log(response);                    
                } else {
                    console.log("received response from old user's timeline");
                }
            },
            error: function (d, msg) {
                console.log('failed to fetch user timeline: ' + msg);
            }
        });
    }

    $('#userSearch').submit(function() {
        $('#twitterResults').html('');
        twitter_username = $('#twitter_username_query').val();
        $.jsonp({
            url: user_info_url + twitter_username,
            success: function (response) {
                user_info = $('#user_info');
                user_info.html('');
                insertLabeledText(user_info, 'Name', response.name);
                insertLabeledText(user_info, 'Screen name', response.screen_name);
                insertLabeledText(user_info, 'Id', response.id);
                insertLabeledText(user_info, 'Location', response.location);
                insertLabeledText(user_info, 'Followers', response.followers_count);
                insertLabeledText(user_info, 'Following', response.friends_count);
                insertLabeledText(user_info, 'Favorites', response.favourites_count);
                insertLabeledText(user_info, 'Tweets', response.statuses_count);
                insertLabeledText(user_info, 'Created', response.created_at);

                $('#user_image').html('<img src="' + response.profile_image_url + '">');
                $('#user_description').html('<p>' + response.description + '</p>');

                fetch_user_tweets(twitter_username);
            },
            error: function (d, msg) {
                console.log('error!');
            }
        });
        return false;
    });
});
