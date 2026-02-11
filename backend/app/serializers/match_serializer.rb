class MatchSerializer
  def self.serialize(match)
    {
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      kickoff_time: match.kickoff_time&.utc&.iso8601,
      group_label: match.group_label,
      home_score: match.home_score,
      away_score: match.away_score,
      odds_home: match.odds_home&.to_f,
      odds_draw: match.odds_draw&.to_f,
      odds_away: match.odds_away&.to_f,
      odds_home_draw: match.odds_home_draw&.to_f,
      odds_draw_away: match.odds_draw_away&.to_f,
      odds_home_away: match.odds_home_away&.to_f
    }.transform_keys { |key| key.to_s.camelize(:lower) }
  end
end
