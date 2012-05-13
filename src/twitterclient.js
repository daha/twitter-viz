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

// TODO: Create a new class for the fetching of the user timeline.
// TODO: Visualize the data with d3.js 
// TODO: User workers for the calculations
// TODO: count all hashtags in the tweets
// TODO: count all the user_mentions in the tweets
$(document).ready(function () {
    var user_info_url = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
        user_timeline_url_base = ('https://api.twitter.com/1/statuses/user_timeline.json'
                            + '?callback=?'
                            + '&count=100'
                            + '&trim_user=1'
                            + '&include_entities=1'
                            + '&include_rts=1'
                            + '&contributor_details=t'
                            + '&screen_name='),
        request_number = 0,
        tweets = [],
        max_id = BigInteger(0),
        since_id = BigInteger(0),
        twitter_username = '';

    function insertLabeledText(selector, label, text) {
        if (text !== '') {
            selector.append('<dt>' + label + '</dt><dd>' + text + '</dd>');
        }
    }

    function fetch_user_timeline(current_request_number, base_url) {
        var current_url = base_url;

        if (!max_id.isZero()) {
            current_url += '&max_id=' + max_id.prev().toString();
        }
        if (!since_id.isZero()) { 
            current_url += "&since_id=" + since_id.next().toString();
        }
        
        $.jsonp({
            url: current_url,
            success: function (response) {
                if (current_request_number === request_number) {
                    if (response.length > 0) { // did get new data
                        if (since_id.isZero()) { // a response with older tweets 
                            tweets = tweets.concat(response);
                        } else if (max_id.isZero()) { // a response with newer tweets
                            tweets = response.concat(tweets);
                        } else { // fairly new, need to sort!
                            tweets = tweets.concat(response);
                            tweets.sort(function (a, b) {
                                return BigInteger(a.id_str).compare(BigInteger(b.id_str));
                            });
                        }
                        max_id = BigInteger(response[response.length - 1].id_str); // The oldest is last
                        fetch_user_timeline(current_request_number, base_url);
                    } else {
                        console.log('No more data to fetch, num_tweets=' + tweets.length);
                        if (tweets.length < 3000) { // The local storage has limited size...
                            localStorage['user=' + twitter_username] = JSON.stringify(tweets);                            
                        }
                        $.each(tweets, function (i, tweet) {
                            $('#tweets').append('<p>'+ tweet.text +'</p>');
                        });
                    }
                } else {
                    console.log('Received response from old search!', current_request_number, request_number);
                }
            },
            error: function (d, msg) {
                console.log('Failed to fetch user timeline: ' + msg);
            }
        });
    }
    
    function fetch_user_tweets(current_request_number) {
        if (localStorage['user=' + twitter_username]) {
            tweets = JSON.parse(localStorage['user=' + twitter_username]);
            console.log('Found ' + tweets.length + ' tweets in localStorage!');
            if (tweets.length > 0) {
                // set since_id to only fetch new feeds (not already fetched)
                since_id = BigInteger(tweets[0].id_str);
            }
        }
        
        // TODO: handle when the query changes while fetching data for an old query
        var current_url = user_timeline_url_base + twitter_username;
        $('#tweets').html('');
        fetch_user_timeline(current_request_number, current_url);        
    }

    $('#userSearch').submit(function () {
        var current_request_number;
        request_number += 1;
        current_request_number = request_number;

        // Reset the internal state, for the new request
        tweets = [];
        max_id = BigInteger(0); 
        since_id = BigInteger(0);
        twitter_username = $('#twitter_username_query').val();
        
        $('#twitterResults').html('');
        
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

                fetch_user_tweets(current_request_number);
            },
            error: function (d, msg) {
                console.log('error!');
            }
        });
        return false;
    });
});
