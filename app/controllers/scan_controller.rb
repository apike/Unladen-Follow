require 'grackle'
require 'date'

class ScanController < ApplicationController
  def index
    # Default scanner
  end
  
  def single
    # User page
    @user = params[:id]
  end
  
  def followed
    # Everybody JSON
    twitter_request("/statuses/home_timeline.json", true)
  end
  
  def user
    # Call for user JSON
    
    user = params[:u]

    # Test for invalid twitter username
    if (!user || user =~ /[^a-z0-9_]+/i)
      render :text => "{twitter_error: 'Invalid username.'}"
    else
      twitter_request("/statuses/user_timeline/" + user + ".json", false)
    end
    
  end
  
  private
  
  def twitter_request(method, needs_auth)
      page_size = 200
      timeout = 20
      
      page = params[:page] ? params[:page].to_i : 1
      if page > 10
        page = 10
      end
      
      begin
        req = Net::HTTP::Get.new(method + "?count=#{page_size}&page=#{page}")
    
        if (needs_auth)
          consumer = OAuth::Consumer.new('kU9aUc0zXGTRMd1oyknjyg', 'LgLlHSCN27Rs5fTwAoxEFUc2MFAp3VGAdwjaGsRVws', {:site => 'http://twitter.com'})
          access_token = OAuth::AccessToken.new(consumer, session[:oauth_token], session[:oauth_secret])
          consumer.sign!(req, access_token)      
        end
    
        res = Net::HTTP.new('twitter.com').start {|http|
          http.read_timeout = timeout
          http.request(req)
        }
      rescue => e
        res = {}
        res.code = "Network error - likely a timeout."
      end

      if res.code.to_i == 200
        render :text => res.body
      else
        render :text => "{twitter_error: #{res.code}}"
      end
  end
end
