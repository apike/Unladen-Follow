class DefaultController < ApplicationController
  def index
  end
  
  def anatomy
    @title = "Anatomy of an Annoying Tweet"
  end

  def login
    require 'oauth'
    
    consumer = get_consumer

    # Get a request token from Twitter
    begin
      @request_token = consumer.get_request_token :oauth_callback => ('http://' + request.env['HTTP_HOST'] + '/default/oauth/')
    rescue
      render :text => "<p>Twitter couldn't give us an OAuth request token right now. Please try again later.</p><p>" + $!
      return
    end

    # Store the request token's details for later
    session[:request_token] = @request_token.token
    session[:request_secret] = @request_token.secret
  
    # Hand off to Twitter so the user can authorize us
    redirect_to @request_token.authorize_url
  end
  
  def logout
    session[:request_token] = nil
    session[:request_secret] = nil
  end
  
  def oauth
    require 'oauth'
    consumer = get_consumer
    
    # Re-create the request token
    @request_token = OAuth::RequestToken.new(consumer, session[:request_token], session[:request_secret])
    
    # Convert the request token to an access token using the verifier Twitter gave us
    begin
      @access_token = @request_token.get_access_token(:oauth_verifier => params[:oauth_verifier])
    rescue
      render :text => "<p>Twitter couldn't verify your OAuth request token right now. Please try again later.</p><p>" + $!
      return
    end

    # Store the token and secret that we need to make API calls
    session[:oauth_token] = @access_token.token
    session[:oauth_secret] = @access_token.secret

    redirect_to '/scan/'
  end
  
  def logout
    reset_session
    redirect_to "/"
  end
  
  private
  
  def get_consumer
    OAuth::Consumer.new(
      '8bKm7x1kEgeYDLyzdgLw', 
      'wcetbJFxNSb2IRjq4zcqJeUA058LhTUO5hgR5g', 
      {:site => 'http://twitter.com'}
    )
  end

end
