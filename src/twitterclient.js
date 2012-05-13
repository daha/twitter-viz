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
    var url = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
        twitter_username;

    function insertLabeledText(selector, label, text) {
        if (text !== '') {
            selector.append('<dt>' + label + '</dt><dd>' + text + '</dd>');
        }
    }

    $('#userSearch').submit(function() {
        $('#twitterResults').html('');
        twitter_username = $('#twitter_username_query').val();
        $.jsonp({
            url: url + twitter_username,
            success: function(response) {
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
            },
            error: function(d, msg) {
                console.log('error!');
            }
        });
        return false;
    });
});
