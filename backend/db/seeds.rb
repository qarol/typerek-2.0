# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

User.find_or_create_by!(nickname: "admin") do |u|
  u.password = "password"
  u.admin = true
  u.activated = true
end

# Load World Cup 2026 match data from YAML
match_data = YAML.load_file(Rails.root.join("db/seeds/data/world_cup_2026.yml"))
match_data["matches"].each do |match_attrs|
  Match.find_or_create_by!(
    home_team: match_attrs["home_team"],
    away_team: match_attrs["away_team"],
    kickoff_time: match_attrs["kickoff_time"]
  ) do |m|
    m.group_label = match_attrs["group_label"]
    m.home_score = match_attrs["home_score"]
    m.away_score = match_attrs["away_score"]
    m.odds_home = match_attrs["odds_home"]
    m.odds_draw = match_attrs["odds_draw"]
    m.odds_away = match_attrs["odds_away"]
    m.odds_home_draw = match_attrs["odds_home_draw"]
    m.odds_draw_away = match_attrs["odds_draw_away"]
    m.odds_home_away = match_attrs["odds_home_away"]
  end
end

puts "Seeded #{Match.count} matches"
