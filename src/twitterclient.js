$(document).ready(function() {
    var url = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
        query;
    
    $('#queryButton').click(function() {
        $("#twitterResults").html('');
        query = $("#queryString").val();

        $.getJSON(url + query, function(jsonTwitter) {
            console.log(jsonTwitter);
        });

    });
});
