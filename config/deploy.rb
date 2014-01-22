# A simple capistrano deploy script.

set :application, "unladen"

server "unladenfollow.com", :web, :primary => true
set :deploy_to, "/var/www/www.unladenfollow.com"

set :scm, :git
set :repository, "git@github.com:apike/Unladen-Follow.git"
set :scm_passphrase, ""
set :deploy_via, :remote_cache
set :keep_releases, 5
after "deploy:update", "deploy:cleanup"

set :user, "ec2-user"

set :use_sudo, false

set :normalize_asset_timestamps, false