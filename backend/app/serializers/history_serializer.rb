class HistorySerializer
  def self.serialize(entry)
    scored = !entry[:home_score].nil?
    correct = if !scored
      nil
    elsif entry[:points_earned].to_f > 0
      true
    else
      false
    end

    {
      matchId: entry[:match_id],
      homeTeam: entry[:home_team],
      awayTeam: entry[:away_team],
      kickoffTime: entry[:kickoff_time],
      homeScore: entry[:home_score],
      awayScore: entry[:away_score],
      betType: entry[:bet_type],
      pointsEarned: entry[:points_earned].to_f,
      correct: correct
    }
  end
end
