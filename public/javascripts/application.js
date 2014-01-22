// Copyright Allen Pike.
// 

var Unladen = {
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Constants
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    CONTACT_STRING: "<p>Please try again, or you can <a href='http://www.antipode.ca/contact/'>contact me</a>.</p>",
    METRICS: {
        "count": 1,
        "favorited" : -5,
        "hashes": 1,
        "links": 2,
        "mentions": 0.5,
        "meta": 2
    },
    MAX_RUNTIME: 10000,
    MAX_PAGES: 8,
    PROGRESS_MESSAGES: [
        "Steeping",
        "Tweeting",
        "Snorgling",
        "Twerking",
        "Reconstituting",
        "Interpolating",
        "Synergizing",
        "Reticulating",
        "Digesting",
        "Regressing",
        "Crunching",
        "Lambasting",
        "Consuming",
        "Massaging",
        "Sublimating",
        "Exercising",
        "Exorcising",
        "Divining",
        "Extrapolating",
        "Volumetrizing"
    ],
    
    GLENNF_TLU: 1000,
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Members
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    used_messages: {},
    simulated_users: [],
    users: {},
    oldest_result: null,
    start_time: new Date(),
    current_page: 1,
    initial_days_of_data: null,
    single_mode: false,

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Entry Points
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Entry point for user profile
    go_single: function(user) {
        this.single_mode = true;
        this.get_user(user);
    },
    
    // Jump from homepage to a user
    go_user_jump: function() {
        window.location = "/u/" + $("#jumpto").val();

        return false;
    },
    
    // Entry point for simulating a user
    go_simulate: function() {
        $('#simulate_spinner').css('display', 'inline');

        this.get_user($('#simulate').val(), true);
        this.show_all();
        return false; // Stop form from going
    },    

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Controller
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Get one user, either for simulation or profile
    get_user: function(user, is_simulation) {
        user = user.toLowerCase();

        Unladen.simulated_users[user] = true;
        Unladen.users[user] = false;

        $.getJSON("/twitter/user/" + user, {}, function(json) {
            $('#simulate').val(''); // Clear out simulate value
            
            var status = Unladen.process_tweets(json);
            if (status !== true) {
                console.log('Status not true, error');
                if (is_simulation) {
                    Unladen.simulate_error(status);
                } else {
                    Unladen.load_error(status);
                }
            } else {
                console.log('Status true, okay');
                Unladen.process_users();
            }
            $('#simulate_spinner').css('display', 'none');
        });
    },
    
    // Process HTTP error from Twitter for simulate
    simulate_error: function(status) {
        var error_message = '';
        console.log(status);
        
        if (status == 401) {
            error_message = "User is private.";
        } else if (status == 404) {
            error_message = "There is no such user.";
        } else if (status == 429) {
            error_message = "You've been rate limited. Try again in 15 minutes.";
        } else if (status == 400) {
            error_message = "Twitter is rate limiting us. (They are likely over capacity.)";
        } else if (status == -1) {
            error_message = "No tweets.";
        } else {
            error_message = "Twitter error #" + status + ".";
        }

        $('#simulate_error').css('display', 'block'); // make show()
        $('#simulate_error').html(error_message);
    },
    
    // Process HTTP error from Twitter for scan
    load_error: function(status) {
        var error_msg = 'Derp.';
        if (status == 401 && this.single_mode) {
            error_msg = "This user's tweets are private.";
        } else if (status == 401) {
            error_msg = "You are not authenticated. <a href='/twitter/connect/'>Please authorize with Twitter here</a>.";
        } else if (status == 429) {
            error_msg = "You've been rate limited. Try again in 15 minutes.";
        } else if (status == 400) {
            error_msg = "Twitter is rate limiting us, which shouldn't happen because we're whitelisted. " + this.CONTACT_STRING;
        } else if (status == 403) {
            error_msg = "Twitter says you're unauthorized. You'll need to log in again. " + this.CONTACT_STRING;
        } else if (status == -1) {
            error_msg = "No tweets found. If you follow anybody, this means Twitter is having issues.";
        } else {
            error_msg = "We got an error trying to scan your tweets, likely because of Twitter being down. " + this.CONTACT_STRING + "<p>Twitter error #" + status + ".";
        }
        Unladen.show_results(error_msg);
    },
    
    // Return false if we've taken too long or have all the data
    should_keep_going: function() {
        return (new Date() - this.start_time < this.MAX_RUNTIME && this.current_page < this.MAX_PAGES);
    },

    // Hit the server for more tweets
    get_tweets: function() {
        this.display_progress_message();
        
        $("body").ajaxError(function(event, request, settings){
            console.log(request);
            Unladen.show_results("Unladen Follow fell down!" + Unladen.CONTACT_STRING + "<p>Error " + request.status + ".");
            return false;
         });
        
        $.getJSON("/twitter/timeline/" + this.current_page, {}, function(json) {
            var status = Unladen.process_tweets(json);
			// 502 means Twitter is overloaded.

            console.log("Status", status);
			
			if (status !== true && status != 502) {
                // Here, we could keep going depending on which error it is.
                Unladen.load_error(status);
            } else if (Unladen.should_keep_going()) {
				if (status == 502) {
					// Twitter is overloaded. Reduce page size and retry same page.
					console.log("Got 502 overloaded error from Twitter. Trying same page again.");
				} else {
	                Unladen.current_page += 1;
				}
				
                // Still have more worth querying
                Unladen.get_tweets();
            } else {
                Unladen.process_users();
            }
        });
    },
    
    // Sort out some raw tweet JSON.
    process_tweets: function(tweets) {
        if (tweets.twitter_error) {
            return tweets.twitter_error;
        } else if (tweets.length == 0 && !Unladen.users) {
            return -1;
        }
        
        var tweet = {};
        var users = Unladen.users;

        for (var i = 0; i < tweets.length; i++) {
            tweet = tweets[i];
            
            if (tweet.text.match(/^@/) != null) {
                // Completely ignore @replies
                continue;
            }
            
            name = tweet.user.screen_name.toLowerCase();
            
            current_user = users[name];
            if (!current_user) {
                users[name] = {};
                current_user = users[name];
                this.reset_user(current_user);
            }   

            if (!current_user["image"]) {
                current_user["image"] = tweet.user.profile_image_url;
                current_user["real_name"] = tweet.user.name;
            }
            
            // Add up the user's score from the various factors.
                        
            current_user["count"] += 1;
            current_user["favorited"] += tweet.favorited ? 1 : 0;
            current_user["hashes"] += this.count_occurrences(tweet.text, '#');
            current_user["links"] += this.count_occurrences(tweet.text, 'http://');
            current_user["mentions"] += this.count_occurrences(tweet.text, '@');

            current_user["meta"] += this.count_occurrences(tweet.text, 'twitter');
            current_user["meta"] += this.count_occurrences(tweet.text, 'media');
            current_user["meta"] += this.count_occurrences(tweet.text, 'tweet');
            current_user["meta"] += this.count_occurrences(tweet.text, 'please');
            current_user["meta"] += this.count_occurrences(tweet.text, 'retweet');
            
            this.oldest_result = tweet.created_at;
        }
        
        return true;
    },
    
    // Process users for final consumption, now that all JSON calls have been made.
    process_users: function() {
        // How many weeks our oldest result was ago
        var elapsed_milliseconds = new Date().valueOf() - this.parse_twitter_date(this.oldest_result).valueOf();
        var days_of_data = elapsed_milliseconds / 1000 / 60 / 60 / 24;
        
        if (!this.initial_days_of_data) {
            // Only store WOD for all-users run
            this.initial_days_of_data = days_of_data;
        }
        
        var user_array = [];
        var user = null;
        var total_cost = 0;
        
        for (var username in this.users) {
            user = this.users[username];

            if (!user) {
                // This can happen if one user fails to load.
                continue;
            }

            user_array.push(user);

            if (!user["score"]) {
                // They weren't processed on a previous round
                user["name"] = username;
                user["score"] = 0;

                // Loop through metrics for this user, and adjust for timespan and weights
                for (var key in this.METRICS) {
                    user[key] /= days_of_data;
                    user["score"] += user[key] * this.METRICS[key];
                }
            }

            total_cost += user["score"];
        }
        
        if (user_array.length == 1) {
            this.display_single(user_array[0], days_of_data);
        } else {
            // Sort by score
            user_array.sort(function(a, b) {
                return b["score"] - a["score"];
            });

            this.display_full_table(user_array, total_cost);
        }
    },
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // View
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Fill single profile with data
    display_single: function(user, days_of_data) {
        $('#tlu').html(this.r10(user["score"]));
        $('#link').attr("href", "");
        
        var link_url = 'http://www.twitter.com/' + user["name"];
        var link_text = (user["real_name"] || user["name"]) + "'s Twitter profile";
        $('#link').html("<a href='" + link_url + "'>" + link_text + "</a>.");

        $("#volume").html(this.r10(user["count"]));
        $("#hashes").html(this.r10(user["hashes"]));
        $("#links").html(this.r10(user["links"]));
        $("#mentions").html(this.r10(user["mentions"]));
        $("#meta").html(this.r10(user["meta"]));

        $('#weeks').html("Derived from <b>" + this.r10(days_of_data) + "</b> days of tweets.");
        
        $('#' + this.beaufort_scale(user["score"])).addClass("on");
    },
    
    // Full scan page with data
    display_full_table: function(user_array, total_cost) {
        var html = [];

        $("#total_cost").html(Math.round(total_cost));
        $("#glennf_times").html(Unladen.r10(total_cost / this.GLENNF_TLU));

        html.column = function(value, className) {
            this.push('<td ' + (className ? ('class=' + className) : '') + '>' + Math.round(value) + '</td>');
        };
        
        var list_is_truncated = false;
        
        html.push('<table id="scan">\
            <tr class="header">\
                <td>TLU <div>Total Tweet Load Units per Week</div></td>\
                <td></td>\
                <td>*<div>Tweet Quantity</div></td>\
                <td>@<div>@ Mentions</div></td>\
                <td>#<div>Hash Tags</div></td>\
                <td>&#8734;<div>Talking About Twitter</div></td>\
                <td>://<div>Links</div></td>\
                <td>&#9733;<div>Favourited</div></td>\
            </tr>');

        for (key in user_array) {
            user = user_array[key];
            
            var className = '';
            if (Unladen.simulated_users[user["name"]]) {
                className = 'simulated';
            }
            
            if (key >= 10 && Unladen.simulated_users.length == 0) {
                // No long-tail hiding when you simulate users
                className += ' long_tail';
                list_is_truncated = true;
            }
            
            html.push('<tr class="' + className + '">');
            html.column(user["score"], 'score');
            html.push('<td class="user"><a href="/u/' + user["name"] + '">' + user["name"] + '</td>');
            html.column(user["count"]);
            html.column(user["mentions"]);
            html.column(user["hashes"]);
            html.column(user["meta"]);
            html.column(user["links"]);
            html.column(user["favorited"]);
            html.push('</tr>');
            
        }
        
        html.push('</table>');
        
        $('#scan_wrapper').html(html.join(''));
        
        
        if (!list_is_truncated) {
            this.show_all();
        }
        
        $('#days_of_data').html(this.r10(this.initial_days_of_data));
        
        this.show_results();
    },

    // Get a message we haven't used before
    display_progress_message: function() {
        var m = null;
        while (!m || this.used_messages[m]) {
            m = Math.floor(Math.random(new Date().valueOf()) * this.PROGRESS_MESSAGES.length);
        }
        this.used_messages[m] = true;
        
        $('#progress').append('<br>' + this.PROGRESS_MESSAGES[m] + " tweets...");
    },
        

    // Flip the View switch. (Could use more MVC-ness now.)
    show_results: function(html) {
        $('#loading').hide();
        $('#results').show();
        
        if (html) {
            // If no HTML, the results have been built in #results
            $('#results').html(html);
        }
    },
    
    // Display the "long tail" results
    show_all: function() {
        $("body").addClass("all_mode");
    },
        
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Utility
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Rounds to 10ths place.
    r10: function(input) {
        return Math.round(input * 10) / 10;
    },
    
    // Return how many of a needle string are in a haystack
    count_occurrences: function(haystack, needle) {
        count = 0;

        for (var i = 0; i < haystack.length; i++) { 
            if (needle == haystack.substr(i,needle.length)) {
                count++; 
            }
        }
        
        return count;
    },

    // Convert crazy Twitter date format into something parseable.
    parse_twitter_date: function(string) {
        //Got: Wed Nov 18 18:36:34 +0000 2009
        //     0   1   2  3        4     5

        var p = string.split(" ");

        //Convert to: Nov 18 2009 18:36:34 +0000 
        //            1   2  5    3        4     

        var order = [1, 2, 5, 3, 4];
        var parseable = [];

        for (i in order) {
            parseable.push(p[order[i]]);
        }

        parseable = parseable.join(" ");
        
        return new Date(parseable);
    },
    
    // Fill a user object with empty data
    reset_user: function(user) {
        for (var key in this.METRICS) {
            user[key] = 0;
        }
    },
    
    // Describe a TLU in English
    beaufort_scale: function(tlu) {
        if (tlu < 10 ) {
            return "breeze";
        } else if (tlu < 25) {
            return "wind";
        } else if (tlu < 50) {
            return "gale";
        } else if (tlu < 100) {
            return "storm";
        } else {
            return "hurricane";
        }
    }
    
};